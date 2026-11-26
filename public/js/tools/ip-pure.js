(function () {
  // IP 纯净度检测：多源出口查询、黑名单核验、浏览器指纹与风险评分
  // 引擎引用挂在 window 上，脚本重复执行时仍可销毁上一实例
  const toolState = window.__vemiyIpCheck || (window.__vemiyIpCheck = { engine: null });

  // 出口探测源需要拼接当前出口地址，故提升到模块作用域
  let currentExitIp = "";

  var IP_TIMEOUT = 9000;

  var BAND_COLORS = {
    best: '#4ade80',
    good: '#a3e635',
    ok: '#facc15',
    warn: '#fb923c',
    bad: '#f87171',
    worst: '#ef4444'
  };

  var RESIDENTIAL_PATTERN = /china unicom|china telecom|china mobile|china169|chinanet|cmnet|unicom|telecom|comcast|verizon|at&t|charter|spectrum|cox commun|centurylink|deutsche telekom|vodafone|orange s\.a|bt group|virgin media|kddi|ntt docomo|softbank|sk broadband|kt corp|lgu|telia|elisa|telenor|swisscom|telefonica|telecom italia|fastweb|broadband|adsl|ftth|fttx|dial.?up|residential|consumer|cable|dsl|fiber|hinet|seednet|so-net|biglobe|shaw|rogers|bell canada|telus|videotron|optus|telstra|spark nz|vocus|tpg internet/i;
  var HOSTNAME_PATTERN = /googleusercontent|amazonaws|azure|cloudapp|digitalocean|linode|vultr|ovh|hetzner|contabo|cloudflare|fastly|akamai|cdn|static|hosting|server|vps|dedicated|colo/i;
  var PROXY_PATTERN = /vpn|proxy|tunnel|backconnect|residential proxy|socks|shadowsocks|wireguard|openvpn/i;

  var EXIT_SOURCES = [
    { name: 'Cloudflare', url: 'https://www.cloudflare.com/cdn-cgi/trace', kind: 'trace' },
    { name: 'ipinfo.io', url: 'https://ipinfo.io/json', kind: 'json' },
    { name: 'ip.sb', url: 'https://api.ip.sb/geoip', kind: 'json' },
    { name: 'ipapi.is', url: 'https://api.ipapi.is/?q=', kind: 'ipapiis' }
  ];

  var EXIT_TIMEOUT = 8000;

  var GEO_SOURCES = [
    {
      name: 'ip.sb',
      url: 'https://api.ip.sb/geoip/',
      parse: function (d) {
        if (!d || !d.ip) return null;
        return { country: d.country, region: d.region, city: d.city, isp: d.organization || d.isp };
      }
    },
    {
      name: 'ip-api',
      url: 'http://ip-api.com/json/',
      suffix: '?fields=status,country,regionName,city,isp,hosting,proxy',
      parse: function (d) {
        if (!d || d.status !== 'success') return null;
        return { country: d.country, region: d.regionName, city: d.city, isp: d.isp, hosting: d.hosting, proxy: d.proxy };
      }
    },
    {
      name: 'ipapi.is',
      url: 'https://api.ipapi.is/?q=',
      parse: function (d) {
        if (!d || !d.ip) return null;
        return { country: d.country, region: d.region, city: d.city, isp: d.company };
      }
    },
    {
      name: 'ipwho.is',
      url: 'https://ipwho.is/',
      parse: function (d) {
        if (!d || !d.success) return null;
        return { country: d.country, region: d.region, city: d.city, isp: (d.connection && d.connection.isp) || '' };
      }
    }
  ];

  var DOH_ENDPOINTS = [
    'https://dns.alidns.com/resolve',
    'https://cloudflare-dns.com/dns-query'
  ];

  var dohIndex = 0;

  var DNSBL_LISTS = [
    { host: 'bl.spamcop.net', name: 'SpamCop' },
    { host: 'dnsbl.dronebl.org', name: 'DroneBL' },
    { host: 'dnsbl.sorbs.net', name: 'SORBS' },
    { host: 'dnsbl-1.uceprotect.net', name: 'UCEPROTECT L1' },
    { host: 'dnsbl-2.uceprotect.net', name: 'UCEPROTECT L2' },
    { host: 'all.s5h.net', name: 's5h.net' },
    { host: 'psbl.surriel.com', name: 'PSBL' },
    { host: 'spam.dnsbl.sorbs.net', name: 'SORBS Spam' },
    { host: 'backscatter.spameatingmonkey.net', name: 'SEM Backscatter' }
  ];

  function withTimeout(promise, ms) {
    return new Promise(function (resolve) {
      var settled = false;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        resolve(null);
      }, ms);

      promise.then(function (value) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      }).catch(function () {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(null);
      });
    });
  }

  function fetchJson(url, timeout) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        resolve(null);
      }, timeout || IP_TIMEOUT);

      fetch(url, { cache: 'no-store' })
        .then(function (res) {
          if (!res.ok) throw new Error('http ' + res.status);
          return res.json();
        })
        .then(function (data) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve(data);
        })
        .catch(function () {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve(null);
        });
    });
  }

  function fetchText(url, timeout) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        resolve(null);
      }, timeout || IP_TIMEOUT);

      fetch(url, { cache: 'no-store' })
        .then(function (res) {
          if (!res.ok) throw new Error('http ' + res.status);
          return res.text();
        })
        .then(function (text) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve(text);
        })
        .catch(function () {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve(null);
        });
    });
  }

  function fetchJsonRetry(urls, timeout) {
    var index = 0;

    function attempt() {
      if (index >= urls.length) return Promise.resolve(null);
      var url = urls[index++];
      return fetchJson(url, timeout).then(function (data) {
        if (data) return data;
        return attempt();
      });
    }

    return attempt();
  }

  function parseUserAgent(ua) {
    var result = { browser: '', version: '', os: '', engine: '' };
    var m;

    if ((m = ua.match(/Edg\/([\d.]+)/))) { result.browser = 'Edge'; result.version = m[1]; }
    else if ((m = ua.match(/OPR\/([\d.]+)/))) { result.browser = 'Opera'; result.version = m[1]; }
    else if ((m = ua.match(/Firefox\/([\d.]+)/))) { result.browser = 'Firefox'; result.version = m[1]; }
    else if ((m = ua.match(/Chrome\/([\d.]+)/))) { result.browser = 'Chrome'; result.version = m[1]; }
    else if ((m = ua.match(/Version\/([\d.]+).*Safari/))) { result.browser = 'Safari'; result.version = m[1]; }

    if (ua.indexOf('Windows NT 10') !== -1) result.os = 'Windows 10 / 11';
    else if (ua.indexOf('Windows NT 6.3') !== -1) result.os = 'Windows 8.1';
    else if (ua.indexOf('Windows') !== -1) result.os = 'Windows';
    else if ((m = ua.match(/Mac OS X ([\d_]+)/))) result.os = 'macOS ' + m[1].replace(/_/g, '.');
    else if (ua.indexOf('Android') !== -1) result.os = 'Android';
    else if ((m = ua.match(/iPhone OS ([\d_]+)/))) result.os = 'iOS ' + m[1].replace(/_/g, '.');
    else if (ua.indexOf('Linux') !== -1) result.os = 'Linux';

    if (ua.indexOf('HeadlessChrome') !== -1) result.engine = 'Headless Chrome';

    if (result.browser && result.version) {
      var major = result.version.split('.')[0];
      result.browser += ' ' + major;
    }

    return result;
  }

  function detectWebrtcLeak() {
    return new Promise(function (resolve) {
      var Ctor = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;

      if (!Ctor) {
        resolve({ supported: false, addrs: [] });
        return;
      }

      var addrs = [];
      var hasMdns = false;
      var finished = false;

      function finish() {
        if (finished) return;
        finished = true;
        resolve({ supported: true, addrs: addrs, hasMdns: hasMdns });
      }

      var pc;

      try {
        pc = new Ctor({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      } catch (err) {
        resolve({ supported: false, addrs: [] });
        return;
      }

      pc.onicecandidate = function (evt) {
        if (!evt || !evt.candidate) {
          finish();
          return;
        }

        var text = evt.candidate.candidate || '';
        var match = text.match(/(\d{1,3}(\.\d{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{0,4}){2,7})/i);

        if (match) {
          var addr = match[1];

          if (addr.indexOf('.') !== -1 && /^(0\.|127\.|169\.254\.)/.test(addr)) return;
          if (addr.indexOf(':') !== -1 && (addr === '::' || addr.indexOf('::1') === 0)) return;
          if (addrs.indexOf(addr) === -1) addrs.push(addr);
        }

        if (text.indexOf('.local') !== -1) {
          hasMdns = true;
        }
      };

      try {
        pc.createDataChannel('probe');
        pc.createOffer().then(function (offer) {
          return pc.setLocalDescription(offer);
        }).catch(function () {
          finish();
        });
      } catch (err) {
        finish();
      }

      setTimeout(function () {
        try { pc.close(); } catch (err) {}
        finish();
      }, 3500);
    });
  }

  // 指纹库按需加载，重复调用复用同一个加载 Promise
  let fingerprintLoader = null;

  function loadFingerprintJs() {
    if (window.FingerprintJS) return Promise.resolve(window.FingerprintJS);
    if (fingerprintLoader) return fingerprintLoader;

    fingerprintLoader = new Promise(function (resolve) {
      var script = document.createElement('script');
      script.src = '/js/fingerprintjs.min.js';
      script.onload = function () {
        resolve(window.FingerprintJS || null);
      };
      script.onerror = function () {
        fingerprintLoader = null;
        resolve(null);
      };
      document.head.appendChild(script);
    });

    return fingerprintLoader;
  }

  function collectFingerprint() {
    var nav = navigator;
    var ua = nav.userAgent || '';
    var result = {
      ua: ua,
      platform: nav.platform || '',
      language: nav.language || '',
      languages: (nav.languages || []).join(', '),
      cores: nav.hardwareConcurrency || 0,
      memory: nav.deviceMemory || 0,
      cookieEnabled: nav.cookieEnabled,
      dnt: nav.doNotTrack || '',
      screen: '',
      viewport: '',
      pixelRatio: 0,
      timezone: '',
      headless: [],
      canvasHash: '',
      webglVendor: '',
      webglRenderer: '',
    };

    try {
      result.screen = screen.width + ' × ' + screen.height;
      result.viewport = window.innerWidth + ' × ' + window.innerHeight;
      result.pixelRatio = window.devicePixelRatio || 1;
    } catch (err) {}

    try {
      result.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (err) {}

    if (/HeadlessChrome/i.test(ua)) result.headless.push('UA 含 HeadlessChrome');
    if (nav.webdriver === true) result.headless.push('webdriver 为真');
    if (!nav.plugins || nav.plugins.length === 0) result.headless.push('插件列表为空');
    if (!nav.languages || nav.languages.length === 0) result.headless.push('语言列表为空');
    if (window.chrome && !window.chrome.runtime) result.headless.push('缺少 chrome.runtime');

    try {
      var canvas = document.createElement('canvas');
      canvas.width = 220;
      canvas.height = 40;
      var ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, 110, 30);
        ctx.fillStyle = '#069';
        ctx.fillText('fingerprint-check', 2, 4);
        ctx.fillStyle = 'rgba(102,204,0,0.6)';
        ctx.fillText('fingerprint-check', 4, 12);

        var data = canvas.toDataURL();
        var hash = 0;
        var index;

        for (index = 0; index < data.length; index++) {
          hash = ((hash << 5) - hash + data.charCodeAt(index)) | 0;
        }

        result.canvasHash = Math.abs(hash).toString(16).slice(0, 16);
      }
    } catch (err) {}

    try {
      var gl = document.createElement('canvas').getContext('webgl') || document.createElement('canvas').getContext('experimental-webgl');

      if (gl) {
        var ext = gl.getExtension('WEBGL_debug_renderer_info');

        if (ext) {
          result.webglVendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || '';
          result.webglRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
        }
      }
    } catch (err) {}

    return result;
  }

  function probeStack() {
    var v4 = fetchText('https://api-ipv4.ip.sb/ip', 6000);
    var v6 = fetchText('https://api-ipv6.ip.sb/ip', 6000);

    return Promise.all([v4, v6]).then(function (res) {
      var addr4 = res[0] ? res[0].trim() : '';
      var addr6 = res[1] ? res[1].trim() : '';

      if (addr4.indexOf('.') === -1) addr4 = '';
      if (addr6.indexOf(':') === -1) addr6 = '';

      var prefer = '';

      if (addr4 && addr6) {
        prefer = '';
      } else if (addr4) {
        prefer = '仅 IPv4';
      } else if (addr6) {
        prefer = '仅 IPv6';
      }

      return { v4: addr4, v6: addr6, prefer: prefer };
    });
  }

  function isOpaqueOrgName(name) {
    if (!name) return false;

    var trimmed = name.replace(/^\s+|\s+$/g, '');

    if (trimmed.length < 6) return false;

    if (/^company\s+[a-z0-9]{8,}/i.test(trimmed)) return true;
    if (/^[a-z0-9]{12,}$/i.test(trimmed)) return true;

    var letters = trimmed.replace(/[^a-zA-Z]/g, '');
    if (letters.length >= 10 && !/[aeiou]{2}/i.test(letters) && !/\s/.test(trimmed)) return true;

    return false;
  }

  var TLD_COUNTRY = {
    es: 'ES', nl: 'NL', it: 'IT', de: 'DE', fr: 'FR', uk: 'GB', gb: 'GB',
    us: 'US', ca: 'CA', ru: 'RU', jp: 'JP', kr: 'KR', cn: 'CN',
    hk: 'HK', tw: 'TW', sg: 'SG', au: 'AU', br: 'BR', in: 'IN',
    se: 'SE', no: 'NO', fi: 'FI', dk: 'DK', pl: 'PL', ch: 'CH',
    at: 'AT', be: 'BE', ie: 'IE', pt: 'PT', cz: 'CZ', ro: 'RO',
    tr: 'TR', il: 'IL', ae: 'AE', za: 'ZA', mx: 'MX', ar: 'AR',
    cl: 'CL', co: 'CO', vn: 'VN', th: 'TH', my: 'MY', id: 'ID',
    ph: 'PH', nz: 'NZ', ua: 'UA', hu: 'HU', bg: 'BG', gr: 'GR'
  };

  function countryFromDomain(domain) {
    if (!domain) return '';

    var parts = domain.split('.');
    if (parts.length < 2) return '';

    var tld = parts[parts.length - 1].toLowerCase();
    return TLD_COUNTRY[tld] || '';
  }

  function judgeIpSource(domain, countryCode) {
    var regCountry = countryFromDomain(domain);
    var useCountry = (countryCode || '').toUpperCase();

    if (!regCountry || !useCountry) return { text: '无法判定', reg: regCountry, use: useCountry };

    if (regCountry === useCountry) {
      return { text: '原生 IP', reg: regCountry, use: useCountry };
    }

    return { text: '广播 IP', reg: regCountry, use: useCountry };
  }

  function ipFamily(ip) {
    if (!ip) return '';
    return ip.indexOf(':') !== -1 ? 'v6' : 'v4';
  }

  function reverseIp(ip) {
    if (!ip || ip.indexOf(':') !== -1) return null;
    var parts = ip.split('.');
    if (parts.length !== 4) return null;
    return parts[3] + '.' + parts[2] + '.' + parts[1] + '.' + parts[0];
  }

  var IP_WORKER_HOSTS = [
    'https://ippure.vemiy.com',
    'https://vemiy-ip-worker.nitian.workers.dev'
  ];

  var ipWorkerHost = '';

  function pickWorkerHost() {
    if (ipWorkerHost) return Promise.resolve(ipWorkerHost);

    var index = 0;

    function tryNext() {
      if (index >= IP_WORKER_HOSTS.length) return Promise.resolve('');

      var host = IP_WORKER_HOSTS[index++];

      return withTimeout(fetchText(host + '/', 6000), 7000).then(function (text) {
        if (text && text.indexOf('vemiy-ip-worker') !== -1) {
          ipWorkerHost = host;
          return host;
        }
        return tryNext();
      }).catch(function () {
        return tryNext();
      });
    }

    return tryNext();
  }

  function queryRadar(asn) {
    if (!asn) return Promise.resolve(null);

    return pickWorkerHost().then(function (host) {
      if (!host) return null;

      return withTimeout(
        fetchJson(host + '/radar/bot?asn=' + encodeURIComponent(asn), 25000),
        26000
      );
    }).catch(function () {
      return null;
    });
  }

  function queryWorker(ip) {
    if (!ip) return Promise.resolve(null);

    return pickWorkerHost().then(function (host) {
      if (!host) return null;

      return withTimeout(
        fetchJson(host + '/all?ip=' + encodeURIComponent(ip), 12000),
        13000
      );
    }).catch(function () {
      return null;
    });
  }

  function queryGeo(ip) {
    if (!ip) return Promise.resolve([]);

    var tasks = GEO_SOURCES.map(function (source) {
      var full = source.suffix
        ? source.url + encodeURIComponent(ip) + source.suffix
        : source.url + encodeURIComponent(ip);

      return fetchJson(full, 8000).then(function (data) {
        var parsed = source.parse(data);

        if (!parsed) return null;

        return {
          name: source.name,
          country: parsed.country || '',
          region: parsed.region || '',
          city: parsed.city || '',
          isp: parsed.isp || '',
          hosting: parsed.hosting,
          proxy: parsed.proxy
        };
      }).catch(function () {
        return null;
      });
    });

    return withTimeout(Promise.all(tasks).then(function (list) {
      return list.filter(Boolean);
    }), 10000).then(function (r) {
      return r || [];
    });
  }

  function queryShodan(ip) {
    if (!ip) return Promise.resolve(null);

    return fetchJson('https://internetdb.shodan.io/' + encodeURIComponent(ip), 8000)
      .then(function (data) {
        if (!data || !data.ip) return null;
        return {
          ports: Array.isArray(data.ports) ? data.ports : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          vulns: Array.isArray(data.vulns) ? data.vulns : [],
          hostnames: Array.isArray(data.hostnames) ? data.hostnames : []
        };
      })
      .catch(function () {
        return null;
      });
  }

  function queryAbuse(ip) {
    if (!ip || ipFamily(ip) !== 'v4') return Promise.resolve(null);

    return fetchJson('https://api.stopforumspam.org/api?ip=' + encodeURIComponent(ip) + '&json', 7000)
      .then(function (data) {
        if (!data || !data.ip) return null;
        return {
          frequency: Number(data.ip.frequency) || 0,
          appears: Number(data.ip.appears) || 0
        };
      })
      .catch(function () {
        return null;
      });
  }

  function probeExit(source) {
    var target = source.kind === 'ipapiis' ? source.url + encodeURIComponent(currentExitIp) : source.url;
    var loader = source.kind === 'trace' ? fetchText(target, EXIT_TIMEOUT) : fetchJson(target, EXIT_TIMEOUT);
    return loader.then(function (data) {
      if (!data) return { name: source.name, ip: null };
      if (source.kind === 'trace') {
        var parsed = parseTrace(data);
        return { name: source.name, ip: parsed ? parsed.ip : null };
      }
      return { name: source.name, ip: data.ip || null };
    });
  }

  function queryDnsbl(ip, list) {
    var reversed = reverseIp(ip);
    if (!reversed) return Promise.resolve({ status: 'unsupported' });

    var doh = DOH_ENDPOINTS[dohIndex % DOH_ENDPOINTS.length];
    var url = doh + '?name=' +
      encodeURIComponent(reversed + '.' + list.host) + '&type=A';

    var task = fetch(url, {
      cache: 'no-store',
      headers: { accept: 'application/dns-json' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('http ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var answers = (data && data.Answer) || [];
        var codes = [];
        var index;

        for (index = 0; index < answers.length; index++) {
          if (answers[index].type !== 1) continue;
          codes.push(answers[index].data);
        }

        if (!codes.length) return { status: 'clean' };

        if (codes.indexOf('127.255.255.254') !== -1 || codes.indexOf('127.255.255.255') !== -1) {
          return { status: 'blocked' };
        }

        return { status: 'listed' };
      })
      .catch(function () {
        dohIndex++;
        return { status: 'error' };
      });

    return withTimeout(task, 4000).then(function (result) {
      return result || { status: 'timeout' };
    });
  }

  function parseTrace(text) {
    if (!text) return null;
    var result = {};
    var lines = text.split('\n');
    var index;

    for (index = 0; index < lines.length; index++) {
      var pos = lines[index].indexOf('=');
      if (pos < 0) continue;
      result[lines[index].slice(0, pos)] = lines[index].slice(pos + 1);
    }

    return result.ip ? result : null;
  }

  function bandOf(risk) {
    if (risk < 15) return { name: '极度纯净', tone: 'best', desc: '未命中任何已确认风险信号' };
    if (risk < 25) return { name: '纯净', tone: 'good', desc: '仅命中极少量风险信号' };
    if (risk < 40) return { name: '中性', tone: 'ok', desc: '命中少量风险信号' };
    if (risk < 50) return { name: '轻度风险', tone: 'warn', desc: '命中若干风险信号' };
    if (risk < 70) return { name: '中度风险', tone: 'bad', desc: '风险信号较多，注册与登录易触发验证' };
    return { name: '极度风险', tone: 'worst', desc: '风险信号密集，多数服务可能拒绝访问' };
  }

  function toneClass(tone) {
    if (tone === 'best') return 'is-best';
    if (tone === 'good') return 'is-good';
    if (tone === 'ok') return 'is-ok';
    if (tone === 'warn') return 'is-warn';
    if (tone === 'bad') return 'is-bad';
    if (tone === 'worst') return 'is-worst';
    return 'is-idle';
  }

  function createIpCheck(root) {
    var startBtn = root.querySelector('#vemiyIpStart');
    var statusEl = root.querySelector('#vemiyIpStatus');
    var scoreNum = root.querySelector('#vemiyIpScoreNum');
    var scoreBand = root.querySelector('#vemiyIpScoreBand');
    var scoreDesc = root.querySelector('#vemiyIpScoreDesc');
    var trackMark = root.querySelector('#vemiyIpTrackMark');
    var infoEl = root.querySelector('#vemiyIpInfo');
    var riskEl = root.querySelector('#vemiyIpRisk');
    var listsEl = root.querySelector('#vemiyIpLists');

    if (listsEl) listsEl.classList.add('is-compact');
    var envEl = root.querySelector('#vemiyIpEnv');
    var geoEl = root.querySelector('#vemiyIpGeo');
    var exitsEl = document.createElement('div');
    var exitsNote = document.createElement('div');
    var exitsHost = null;
    exitsEl.className = 'vemiy-ipcheck-lists is-compact';
    exitsNote.className = 'vemiy-ipcheck-note';

    var running = false;
    var destroyed = false;
    var runToken = 0;
    var radarRowEl = null;
    var radarRatioEl = null;
    var lastScoreOptions = null;
    var exitAddr4 = '';
    var exitAddr6 = '';
    var fpEl = root.querySelector('#vemiyIpFp');

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text;
    }

    function clear(node) {
      while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function appendRow(container, key, valueNode) {
      var row = document.createElement('div');
      row.className = 'vemiy-ipcheck-row';

      var keyEl = document.createElement('div');
      keyEl.className = 'vemiy-ipcheck-key';
      keyEl.textContent = key;

      var valEl = document.createElement('div');
      valEl.className = 'vemiy-ipcheck-val';
      if (typeof valueNode === 'string') {
        valEl.textContent = valueNode;
      } else if (valueNode) {
        valEl.appendChild(valueNode);
      }

      row.appendChild(keyEl);
      row.appendChild(valEl);
      container.appendChild(row);
    }

    function tagEl(text, tone) {
      var el = document.createElement('span');
      el.className = 'vemiy-ipcheck-tag ' + toneClass(tone);
      el.textContent = text;
      return el;
    }

    function setScore(result) {
      var risk = result.risk;
      var band = bandOf(risk);

      scoreNum.textContent = risk + '%';
      scoreNum.style.color = BAND_COLORS[band.tone] || '#ffffff';

      if (scoreBand) {
        scoreBand.textContent = band.name;
        scoreBand.className = 'vemiy-ipcheck-score-band ' + toneClass(band.tone);
      }
      if (scoreDesc) scoreDesc.textContent = band.desc;
      if (trackMark) {
        trackMark.style.left = risk + '%';
        trackMark.style.borderColor = BAND_COLORS[band.tone] || '#ffffff';
        trackMark.style.opacity = '1';
      }
    }

    function resetScore() {
      scoreNum.textContent = '--';
      scoreNum.style.color = 'rgba(255, 255, 255, 0.45)';
      if (scoreBand) {
        scoreBand.textContent = '未检测';
        scoreBand.className = 'vemiy-ipcheck-score-band is-idle';
      }
      if (scoreDesc) scoreDesc.textContent = '开始检测后显示风险百分比';
      if (trackMark) {
        trackMark.style.left = '0';
        trackMark.style.opacity = '0';
      }
    }

    function renderLists(results) {
      clear(listsEl);
      if (!results || !results.length) {
        appendRow(listsEl, '状态', '未查询');
        return;
      }

      var allClean = true;
      var scan;

      for (scan = 0; scan < results.length; scan++) {
        if (results[scan].status !== 'clean' && results[scan].status !== 'unsupported') {
          allClean = false;
          break;
        }
      }

      if (allClean) {
        var head = document.createElement('div');
        head.className = 'vemiy-ipcheck-list-row';

        var headName = document.createElement('div');
        headName.className = 'vemiy-ipcheck-list-name';
        headName.textContent = results.length + ' 个黑名单源';

        head.appendChild(headName);
        head.appendChild(tagEl('全部未命中', 'good'));
        listsEl.appendChild(head);

        return;
      }

      var index;
      for (index = 0; index < results.length; index++) {
        var item = results[index];
        var row = document.createElement('div');
        row.className = 'vemiy-ipcheck-list-row';

        var nameEl = document.createElement('div');
        nameEl.className = 'vemiy-ipcheck-list-name';
        nameEl.textContent = item.name;

        var stateEl;
        if (item.status === 'listed') {
          stateEl = tagEl('已列入', 'bad');
        } else if (item.status === 'blocked') {
          stateEl = tagEl('公共 DNS 受限', 'warn');
        } else if (item.status === 'unsupported') {
          stateEl = tagEl('IPv6 不适用', 'idle');
        } else if (item.status === 'timeout') {
          stateEl = tagEl('查询超时', 'idle');
        } else if (item.status === 'error') {
          stateEl = tagEl('查询失败', 'idle');
        } else {
          stateEl = tagEl('未列入', 'good');
        }

        row.appendChild(nameEl);
        row.appendChild(stateEl);
        listsEl.appendChild(row);
      }
    }

    function score(options) {
      var items = [];
      var safe = 1;

      function add(name, probability, note) {
        var p = probability;

        if (p < 0) p = 0;
        if (p > 0.92) p = 0.92;

        items.push({ name: name, points: Math.round(p * 100), note: note || '' });

        if (p > 0) safe *= (1 - p);
      }

      if (options.blockListed) {
        add('\u6076\u610f\u7f51\u6bb5', 0.58, '\u5a01\u80c1\u60c5\u62a5\u7f51\u6bb5\u547d\u4e2d');
      }

      if (options.listedCount > 0) {
        add('\u5a01\u80c1\u9ed1\u540d\u5355', Math.min(0.8, 0.31 + (options.listedCount - 1) * 0.09), options.listedCount + ' \u9879\u547d\u4e2d');
      }

      if (options.abuseCount > 0) {
        add('\u6ee5\u7528\u8bb0\u5f55', Math.min(0.6, 0.13 + Math.log(options.abuseCount + 1) * 0.24), options.abuseCount + ' \u6b21');
      }

      if (options.proxyCount > 0) {
        add('\u4ee3\u7406\u8bc1\u636e', Math.min(0.5, 0.07 + options.proxyCount * 0.11), options.proxyCount + ' \u9879');
      }

      if (typeof options.radarBot === 'number' && options.radarBot > 26) {
        var botRisk = (options.radarBot - 26) / 74 * 0.16;

        if (!options.datacenter) botRisk *= 0.19;

        add('\u4eba\u673a\u6d41\u91cf\u6bd4', botRisk, '\u673a\u5668\u4eba ' + Math.round(options.radarBot) + '%');
      } else if (options.radarBot === null) {
        add('\u4eba\u673a\u6d41\u91cf\u6bd4\u672a\u77e5', 0.05, '\u6570\u636e\u6e90\u672a\u8fd4\u56de');
      }

      if (options.datacenter) {
        add('\u57fa\u7840\u8bbe\u65bd\u7f51\u7edc', 0.26, '\u673a\u623f / VPS / \u4e91\u4e3b\u673a');
      } else {
        add('\u4f4f\u5b85\u5bbd\u5e26', 0.002, '');
      }

      if (options.timezoneMatch === false && !options.datacenter) {
        add('\u65f6\u533a\u4e0d\u7b26', 0.08, '');
      } else if (options.timezoneMatch === null) {
        add('\u65f6\u533a\u672a\u77e5', 0.03, '');
      }

      if (options.exitDistinct >= 3) {
        add('\u51fa\u53e3\u5206\u6d41', 0.28, options.exitDistinct + ' \u4e2a\u4e0d\u540c\u51fa\u53e3');
      } else if (options.exitDistinct === 2) {
        add('\u51fa\u53e3\u5206\u6d41', 0.09, '2 \u4e2a\u4e0d\u540c\u51fa\u53e3');
      }

      if (options.asnConsistent === false) add('\u6570\u636e\u6e90\u5206\u6b67', 0.05, '');
      if (options.suspiciousHostname && !options.datacenter) add('\u53cd\u5411\u89e3\u6790\u53ef\u7591', 0.04, '');

      return { risk: Math.min(100, Math.round((1 - safe) * 100)), items: items };
    }

    function runExits(ip) {
      currentExitIp = ip || '';

      var tasks = EXIT_SOURCES.map(function (source) {
        return withTimeout(probeExit(source), EXIT_TIMEOUT).then(function (result) {
          return result || { name: source.name, ip: null };
        }).catch(function () {
          return { name: source.name, ip: null };
        });
      });

      return Promise.all(tasks);
    }

    function updateRadarRow(botPct) {
      if (!radarRatioEl) return;

      var botRound = Math.round(num(botPct));
      var humanPct = 100 - botRound;
      var level = botRound >= 70 ? 'bad' : botRound >= 40 ? 'warn' : 'good';

      clear(radarRatioEl);
      radarRatioEl.appendChild(tagEl('真人 ' + humanPct + '% / 机器人 ' + botRound + '%', level));

      if (lastScoreOptions) {
        lastScoreOptions.radarBot = botRound;
      }
    }

    function renderRisks(d) {
      clear(riskEl);

      var typeEl = document.createElement('span');
      typeEl.appendChild(tagEl(d.datacenter ? '机房 IP' : (d.residential ? '住宅 IP' : '用途未识别'),
        d.datacenter ? 'warn' : (d.residential ? 'good' : 'idle')));
      appendRow(riskEl, 'IP 属性', typeEl);

      radarRatioEl = document.createElement('span');
      radarRowEl = document.createElement('div');
      radarRowEl.className = 'vemiy-ipcheck-row';

      var radarKeyEl = document.createElement('div');
      radarKeyEl.className = 'vemiy-ipcheck-key';
      radarKeyEl.textContent = '人机流量比';

      radarRowEl.appendChild(radarKeyEl);
      radarRowEl.appendChild(radarRatioEl);
      riskEl.appendChild(radarRowEl);

      if (d.radarBot !== null) {
        updateRadarRow(d.radarBot);
      } else {
        radarRatioEl.appendChild(tagEl('查询中', 'idle'));
      }

      var proxyEl = document.createElement('span');
      var proxySignals = d.proxySignals;

      if (proxySignals.length === 0) {
        proxyEl.appendChild(tagEl('未发现代理迹象', 'good'));
      } else if (proxySignals.indexOf('WARP') !== -1 || proxySignals.length >= 2) {
        proxyEl.appendChild(tagEl('高度疑似代理或 VPN', 'bad'));
      } else {
        proxyEl.appendChild(tagEl('疑似代理或 VPN', 'warn'));
      }

      appendRow(riskEl, '代理 / VPN', proxyEl);

      if (proxySignals.length > 0) {
        appendRow(riskEl, '判定依据', proxySignals.join(' · '));
      }

      var counts = d.counts;
      var listEl = document.createElement('span');

      if (counts.listed > 0) {
        listEl.appendChild(tagEl(counts.listed + ' 个命中', 'bad'));
      } else if (counts.checked > 0) {
        listEl.appendChild(tagEl('已查 ' + counts.checked + ' 个，未命中', 'good'));
      } else {
        listEl.appendChild(tagEl('未取得有效结果', 'idle'));
      }

      if (counts.blocked > 0) {
        listEl.appendChild(document.createTextNode(' '));
        listEl.appendChild(tagEl(counts.blocked + ' 个公共 DNS 受限', 'warn'));
      }

      if (counts.timeout > 0) {
        listEl.appendChild(document.createTextNode(' '));
        listEl.appendChild(tagEl(counts.timeout + ' 个超时', 'idle'));
      }

      if (counts.unsupported > 0) {
        listEl.appendChild(document.createTextNode(' '));
        listEl.appendChild(tagEl(counts.unsupported + ' 个不支持当前协议', 'idle'));
      }

      if (d.dnsblNote) {
        listEl.appendChild(document.createTextNode(' '));
        listEl.appendChild(tagEl(d.dnsblNote, 'idle'));
      }

      appendRow(riskEl, '实时黑名单', listEl);

      if (d.block !== null) {
        var blockEl = document.createElement('span');

        if (d.block.listed) {
          blockEl.appendChild(tagEl('命中威胁网段', 'bad'));
        } else if (d.block.ok) {
          blockEl.appendChild(tagEl('未命中（' + d.block.total + ' 条）', 'good'));
        } else {
          blockEl.appendChild(tagEl('查询失败', 'idle'));
        }

        appendRow(riskEl, '威胁情报库', blockEl);
      }

      if (d.ipv6) {
        appendRow(riskEl, '开放端口', tagEl('IPv6 不支持查询', 'idle'));
      } else if (d.shodan !== null) {
        var portEl = document.createElement('span');

        if (d.shodan.ports.length > 0) {
          portEl.appendChild(tagEl(d.shodan.ports.length + ' 个：' + d.shodan.ports.slice(0, 8).join(' '), 'warn'));
        } else {
          portEl.appendChild(tagEl('无开放端口', 'good'));
        }

        appendRow(riskEl, '开放端口', portEl);

        if (d.shodan.vulns.length > 0) {
          appendRow(riskEl, '已知漏洞',
            tagEl(d.shodan.vulns.length + ' 个：' + d.shodan.vulns.slice(0, 3).join(' '), 'bad'));
        }
      }

      if (d.abuse !== null) {
        var abuseEl = document.createElement('span');
        var abuseTotal = d.abuse.frequency + d.abuse.appears;

        if (abuseTotal > 0) {
          abuseEl.appendChild(tagEl('记录 ' + abuseTotal + ' 次', 'bad'));
        } else {
          abuseEl.appendChild(tagEl('无记录', 'good'));
        }

        appendRow(riskEl, '滥用记录', abuseEl);
      }

      if (d.hostname) {
        appendRow(riskEl, '反向解析', d.hostname);
      }

      if (d.anycast) {
        appendRow(riskEl, '路由异常', tagEl('疑似任播', 'warn'));
      }
    }

    function renderBasics(d) {
      clear(infoEl);

      var addr4 = str(d.stackInfo.v4);
      var addr6 = str(d.stackInfo.v6);

      if (!addr4 && d.ipv6 === false && d.ip) addr4 = d.ip;
      if (!addr6 && d.ipv6 === true && d.ip) addr6 = d.ip;

      appendRow(infoEl, 'IPv4 地址', addr4 || '不可用');
      appendRow(infoEl, 'IPv6 地址', addr6 || '不可用');

      var preferText = '未知';

      if (addr4 && addr6) {
        preferText = d.ipv6 ? 'IPv6 优先' : 'IPv4 优先';
      } else if (addr4) {
        preferText = '仅 IPv4';
      } else if (addr6) {
        preferText = '仅 IPv6';
      }

      appendRow(infoEl, '当前出口协议', preferText);

      appendRow(infoEl, '国家 / 地区', d.country || '未知');

      if (d.region || d.city) {
        appendRow(infoEl, '省份 / 城市', [d.region, d.city].filter(Boolean).join(' · '));
      }

      if (d.ipSource) appendRow(infoEl, 'IP 来源', d.ipSource);
      if (d.asn) appendRow(infoEl, 'ASN', d.asn);
      if (d.org) appendRow(infoEl, '所属组织', d.org);
      if (d.isp && d.isp !== d.org) appendRow(infoEl, '运营商', d.isp);
      if (d.colo) appendRow(infoEl, 'Cloudflare 边缘节点', d.colo);

      if (d.traceIp && d.ip) {
        var traceFamily = ipFamily(d.traceIp);
        var ipFamilyValue = ipFamily(d.ip);
        var traceViaCdn = /^2a09:bac3:/i.test(d.traceIp) || /^2a06:98c0:/i.test(d.traceIp);

        if (traceFamily !== ipFamilyValue) {
          appendRow(infoEl, '另一协议出口', d.traceIp);
        } else if (d.traceIp !== d.ip) {
          if (traceViaCdn) {
            appendRow(infoEl, 'Cloudflare 中转地址', d.traceIp + '（非真实出口）');
          } else {
            appendRow(infoEl, '多源结果不一致', 'Cloudflare 为 ' + d.traceIp + '，其他数据源为 ' + d.ip);
          }
        }
      }

      exitAddr4 = addr4;
      exitAddr6 = addr6;
    }

    function renderGeo(geoList) {
      if (!geoEl) return;

      var section = geoEl.closest('.vemiy-tool-section');
      var list = arr(geoList);

      if (list.length < 2) {
        if (section) section.style.display = 'none';
        return;
      }

      if (section) section.style.display = '';

      clear(geoEl);

      for (var i = 0; i < list.length; i++) {
        var g = obj(list[i]);
        var parts = [str(g.country), str(g.region), str(g.city)].filter(Boolean);
        var text = parts.length ? parts.join(' · ') : '未知';
        var isp = str(g.isp);

        if (isp) text += '  ' + isp;

        var row = document.createElement('div');
        row.className = 'vemiy-ipcheck-list-row';

        var nameEl = document.createElement('div');
        nameEl.className = 'vemiy-ipcheck-list-name';
        nameEl.textContent = str(g.name, '未知源');

        var valEl = document.createElement('div');
        valEl.className = 'vemiy-ipcheck-list-value';
        valEl.textContent = text;

        row.appendChild(nameEl);
        row.appendChild(valEl);
        geoEl.appendChild(row);
      }
    }

    function renderFingerprint(preLeak) {
      clear(fpEl);

      var fp = collectFingerprint();
      var uaInfo = parseUserAgent(fp.ua);

      var fpIdEl = document.createElement('span');
      fpIdEl.appendChild(tagEl('计算中', 'idle'));
      appendRow(fpEl, '指纹 ID', fpIdEl);

      loadFingerprintJs().then(function (FingerprintJS) {
        if (destroyed) return;

        if (!FingerprintJS) {
          clear(fpIdEl);
          fpIdEl.appendChild(tagEl('加载失败', 'idle'));
          return;
        }

        FingerprintJS.load().then(function (agent) {
          return agent.get();
        }).then(function (detail) {
          if (destroyed) return;
          clear(fpIdEl);
          fpIdEl.appendChild(tagEl(str(detail.visitorId, '未知'), 'good'));
        }).catch(function () {
          if (destroyed) return;
          clear(fpIdEl);
          fpIdEl.appendChild(tagEl('计算失败', 'idle'));
        });
      });

      var uaText = [str(uaInfo.browser), str(uaInfo.os)].filter(Boolean).join(' / ');
      appendRow(fpEl, '浏览器 / 系统', uaText || '未知');

      var headlessEl = document.createElement('span');
      var flags = arr(fp.headless);

      if (flags.length === 0) {
        headlessEl.appendChild(tagEl('未发现自动化特征', 'good'));
      } else {
        headlessEl.appendChild(tagEl('检测到自动化特征：' + flags.join('、'), 'bad'));
      }

      appendRow(fpEl, '自动化检测', headlessEl);

      appendRow(fpEl, '屏幕 / 可视区',
        '屏幕 ' + str(fp.screen, '未知') + ' · 视口 ' + str(fp.viewport, '未知') + ' · ' + num(fp.pixelRatio, 1) + 'x');

      var hwParts = [];

      if (num(fp.cores) > 0) hwParts.push(num(fp.cores) + ' 核');
      if (num(fp.memory) > 0) hwParts.push(num(fp.memory) + ' GB 内存');
      if (hwParts.length) appendRow(fpEl, '硬件', hwParts.join(' · '));

      if (fp.canvasHash) appendRow(fpEl, 'Canvas 指纹', fp.canvasHash);
      if (fp.webglRenderer) appendRow(fpEl, '显卡渲染器', fp.webglRenderer);

      var webrtcEl = document.createElement('span');
      appendRow(fpEl, 'WebRTC 检测', webrtcEl);

      var leakPromise = preLeak ? Promise.resolve(preLeak) : detectWebrtcLeak();

      leakPromise.then(function (leak) {
        if (destroyed) return;

        var data = obj(leak);
        var addrs = arr(data.addrs);

        if (data.supported !== true) {
          webrtcEl.appendChild(tagEl('浏览器不支持检测', 'idle'));
          return;
        }

        if (addrs.length === 0) {
          webrtcEl.appendChild(tagEl(data.hasMdns ? '未泄露（已启用 mDNS 混淆）' : '未泄露公网地址', 'good'));
          return;
        }

        var leakedList = [];

        for (var i = 0; i < addrs.length; i++) {
          var addrValue = str(addrs[i]);

          if (addrValue && addrValue !== exitAddr4 && addrValue !== exitAddr6) {
            leakedList.push(addrValue);
          }
        }

        if (leakedList.length === 0) {
          webrtcEl.appendChild(tagEl('未泄露，仅当前出口', 'good'));
        } else {
          webrtcEl.appendChild(tagEl('泄露：' + leakedList.join('  '), 'bad'));
        }
      });
    }

    function renderEnvironment(d) {
      var asnConsistentValue = null;

      clear(envEl);
      exitsHost = null;
      exitsEl = null;
      exitsNote = null;
      appendRow(envEl, '浏览器时区', d.browserTz || '未知');
      appendRow(envEl, 'IP 时区', d.timezone || '未知');

      var tzEl = document.createElement('span');
      if (d.timezoneMatch === true) {
        tzEl.appendChild(tagEl('一致', 'good'));
      } else if (d.timezoneMatch === false) {
        tzEl.appendChild(tagEl('不一致', 'warn'));
      } else {
        tzEl.appendChild(tagEl('无法判断', 'idle'));
      }
      appendRow(envEl, '时区校验', tzEl);

      if (d.asn && d.info && d.info.org) {
        var infoAsn = d.info.org.split(' ')[0];
        asnConsistentValue = infoAsn.indexOf('AS') === 0
          ? infoAsn === d.asn
          : (function () {
              var orgName = d.info.org.split(' ').slice(1).join(' ');
              return orgName ? d.org.indexOf(orgName) !== -1 : null;
            })();

        var asnEl = document.createElement('span');
        if (asnConsistentValue === true) {
          asnEl.appendChild(tagEl('数据源一致', 'good'));
        } else if (asnConsistentValue === false) {
          asnEl.appendChild(tagEl('数据源存在差异', 'warn'));
        } else {
          asnEl.appendChild(tagEl('无法判断', 'idle'));
        }
        appendRow(envEl, '数据源交叉', asnEl);
      }

      if (d.browserLang) {
        appendRow(envEl, '浏览器语言', d.browserLang);
      }

      return asnConsistentValue;
    }

    function renderExits(exitResults) {
      if (!envEl) return { okCount: 0, distinct: 0, mixed: false };

      if (!exitsEl) {
        exitsEl = document.createElement('div');
        exitsEl.className = 'vemiy-ipcheck-lists is-compact';
      }

      if (!exitsNote) {
        exitsNote = document.createElement('div');
        exitsNote.className = 'vemiy-ipcheck-note';
      }

      var exitSummary = { okCount: 0, distinct: 0, mixed: false };
      var distinctByFamily = { v4: {}, v6: {} };
      var countByFamily = { v4: 0, v6: 0 };
      var okCount = 0;
      var index;

      clear(exitsEl);

      if (!exitsHost) {
        exitsHost = document.createElement('div');
        exitsHost.className = 'vemiy-ipcheck-exits';

        var sub = document.createElement('div');
        sub.className = 'vemiy-ipcheck-subtitle';
        sub.textContent = '出口一致性';

        exitsHost.appendChild(sub);
        exitsHost.appendChild(exitsEl);
        if (exitsNote) exitsHost.appendChild(exitsNote);
        envEl.appendChild(exitsHost);
      }

      var grouped = { v4: [], v6: [] };

      for (index = 0; index < exitResults.length; index++) {
        var item = exitResults[index];

        if (item.ip) {
          okCount++;

          var family = ipFamily(item.ip);
          grouped[family].push({ name: item.name, ip: item.ip });

          if (!distinctByFamily[family][item.ip]) {
            distinctByFamily[family][item.ip] = true;
            countByFamily[family]++;
          }
        } else {
          grouped.v4.push({ name: item.name, ip: '' });
        }
      }

      function appendGroup(label, list) {
        if (list.length === 0) return;

        var groupEl = document.createElement('div');
        groupEl.className = 'vemiy-ipcheck-exit-group';

        var labelEl = document.createElement('div');
        labelEl.className = 'vemiy-ipcheck-exit-label';
        labelEl.textContent = label;
        groupEl.appendChild(labelEl);

        var gi;

        for (gi = 0; gi < list.length; gi++) {
          var row = document.createElement('div');
          row.className = 'vemiy-ipcheck-list-row vemiy-ipcheck-exit-row';

          var nameEl = document.createElement('div');
          nameEl.className = 'vemiy-ipcheck-list-name';
          nameEl.textContent = list[gi].name;

          var valEl = document.createElement('div');
          valEl.className = 'vemiy-ipcheck-ip';
          valEl.textContent = list[gi].ip || '获取失败';

          row.appendChild(nameEl);
          row.appendChild(valEl);
          groupEl.appendChild(row);
        }

        exitsEl.appendChild(groupEl);
      }

      appendGroup('IPv4', grouped.v4);
      appendGroup('IPv6', grouped.v6);

      var hasV4 = countByFamily.v4 > 0;
      var hasV6 = countByFamily.v6 > 0;
      var maxDistinct = Math.max(countByFamily.v4, countByFamily.v6);

      var effectiveDistinct = (hasV4 && hasV6) ? 1 : maxDistinct;

      if (!exitsNote) return { okCount: okCount, distinct: effectiveDistinct, mixed: hasV4 && hasV6 };

      if (okCount === 0) {
        exitsNote.textContent = '所有出口源均不可达。';
      } else if (hasV4 && hasV6) {
        exitsNote.textContent = '共 ' + okCount + ' 个数据源，返回结果同时包含 IPv6 与 IPv4，不作一致性判断。';
      } else if (maxDistinct === 1) {
        exitsNote.textContent = '共 ' + okCount + ' 个数据源，出口 IP 完全一致。';
      } else {
        exitsNote.textContent = '共 ' + okCount + ' 个数据源，检测到 ' + maxDistinct + ' 个不同出口 IP。';
      }

      exitSummary.okCount = okCount;
      exitSummary.distinct = effectiveDistinct;
      exitSummary.mixed = hasV4 && hasV6;

      return exitSummary;
    }

    function run() {
      if (running || destroyed) return;

      running = true;
      runToken++;

      var myToken = runToken;

      startBtn.disabled = true;
      setStatus('正在查询出口 IP');
      resetScore();
      clear(infoEl);
      clear(riskEl);
      clear(envEl);
      renderLists(null);

      var context = {};

      var watchdog = setTimeout(function () {
        if (destroyed || myToken !== runToken || !running) return;

        running = false;
        startBtn.disabled = false;
        setStatus('检测超时：部分数据源未在限定时间内返回，请检查网络后重试');
      }, 60000);

      function finish() {
        if (destroyed || myToken !== runToken) return;

        clearTimeout(watchdog);
        running = false;
        startBtn.disabled = false;
        startBtn.textContent = '重新检测';
      }

      function fail(reason) {
        if (destroyed || myToken !== runToken) return;

        setStatus(reason);
        finish();
      }

      function collectBasics() {
        return Promise.all([
          withTimeout(fetchText('https://www.cloudflare.com/cdn-cgi/trace', IP_TIMEOUT), IP_TIMEOUT + 1000),
          withTimeout(fetchJsonRetry(['https://ipwho.is/', 'https://ipapi.co/json/'], IP_TIMEOUT), IP_TIMEOUT + 1000),
          withTimeout(fetchJson('https://ipinfo.io/json', IP_TIMEOUT), IP_TIMEOUT + 1000),
          withTimeout(probeStack(), IP_TIMEOUT + 1000)
        ]).then(function (results) {
          return {
            trace: parseTrace(results[0]),
            whois: results[1],
            info: results[2],
            stackInfo: results[3]
          };
        });
      }

      collectBasics().then(function (basics) {
        if (destroyed || myToken !== runToken) return;

        var trace = basics.trace;
        var whois = basics.whois;
        var info = basics.info;
        var stackInfo = basics.stackInfo;

        if (!whois && !info && !trace) {
          var reason = '检测失败：无法连接任何数据源';

          if (navigator.onLine === false) {
            reason = '检测失败：系统网络已断开';
          }

          fail(reason);
          return;
        }

        var ip = (whois && whois.ip) || (info && info.ip) || (trace && trace.ip) || '';

        context.ip = ip;
        context.trace = trace;
        context.whois = whois;
        context.info = info;
        context.stackInfo = stackInfo;

        var connection = (whois && whois.connection) || {};
        var infoOrg = (info && info.org) || '';
        var infoOrgName = infoOrg.split(' ').slice(1).join(' ');

        context.country = (whois && whois.country_name) || (whois && whois.country) || (info && info.country) || '';
        context.region = (whois && whois.region) || (info && info.region) || '';
        context.city = (whois && whois.city) || (info && info.city) || '';
        context.timezone = (whois && whois.timezone && whois.timezone.id) || (info && info.timezone) || '';
        context.org = infoOrgName || connection.org || (whois && whois.org) || '';
        context.isp = connection.isp || '';
        context.asnDomain = connection.domain || '';
        context.hostname = (info && info.hostname) || '';
        context.traceIp = trace && trace.ip;
        context.colo = trace && trace.colo;
        context.traceLoc = trace && trace.loc;

        var infoHead = infoOrg.split(' ')[0];

        context.asn = infoHead.indexOf('AS') === 0
          ? infoHead
          : (connection.asn && Number(connection.asn) > 0 ? 'AS' + connection.asn : '');

        var orgText = context.org + ' ' + context.isp;

        context.residential = RESIDENTIAL_PATTERN.test(orgText);
        context.datacenter = !context.residential;

        setStatus('正在查询黑名单');

        var dnsblTarget = ip;

        if (ipFamily(ip) === 'v6' && stackInfo && stackInfo.v4) {
          dnsblTarget = stackInfo.v4;
        }

        var listPromises;

        if (ipFamily(dnsblTarget) === 'v6') {
          listPromises = DNSBL_LISTS.map(function (list) {
            return Promise.resolve({ name: list.name, status: 'unsupported' });
          });
        } else {
          listPromises = DNSBL_LISTS.map(function (list) {
            return queryDnsbl(dnsblTarget, list).then(function (res) {
              return { name: list.name, status: res.status };
            });
          });
        }

        context.dnsblTarget = dnsblTarget;

        return Promise.all([
          Promise.all(listPromises),
          withTimeout(queryAbuse(ip), 12000),
          withTimeout(queryShodan(ip), 12000),
          withTimeout(queryGeo(ip), 13000),
          withTimeout(queryWorker(ip), 15000)
        ]).then(function (batch) {
          context.listResults = batch[0];
          context.abuseInfo = batch[1];
          context.shodanInfo = batch[2];
          context.geoList = batch[3] || [];
          context.workerData = batch[4] || null;
          context.blocklistData = context.workerData ? (context.workerData.blocklist || null) : null;
          context.radarAsn = context.workerData ? (context.workerData.asn || '') : '';
          context.radarBot = null;

          return null;
        });
      }).then(function () {
        if (destroyed || myToken !== runToken) return null;

        return Promise.all([
          withTimeout(queryRadar(context.radarAsn), 26000),
          withTimeout(runExits(context.ip), 30000),
          withTimeout(detectWebrtcLeak(), 8000)
        ]).then(function (batch) {
          var radarData = batch[0];

          if (radarData && radarData.ok && typeof radarData.bot === 'number') {
            context.radarBot = radarData.bot;
          }

          context.exitResults = batch[1] || [];
          context.webrtcLeak = batch[2] || null;

          return null;
        });
      }).then(function () {
        if (destroyed || myToken !== runToken) return;

        renderAll(context);
        finish();
      }).catch(function (err) {
        if (destroyed || myToken !== runToken) return;

        fail('检测失败：' + String(err && err.message || err));
      });
    }

    function num(value, fallback) {
      var n = Number(value);
      return isFinite(n) ? n : (typeof fallback === 'number' ? fallback : 0);
    }

    function str(value, fallback) {
      if (value === null || value === undefined) return typeof fallback === 'string' ? fallback : '';
      return String(value);
    }

    function arr(value) {
      return Array.isArray(value) ? value : [];
    }

    function obj(value) {
      return value && typeof value === 'object' ? value : {};
    }

    function normalizeContext(ctx) {
      var shodan = ctx.shodanInfo ? obj(ctx.shodanInfo) : null;
      var abuse = ctx.abuseInfo ? obj(ctx.abuseInfo) : null;
      var block = ctx.blocklistData ? obj(ctx.blocklistData) : null;
      var worker = ctx.workerData ? obj(ctx.workerData) : null;

      var counts = { listed: 0, blocked: 0, checked: 0, unsupported: 0, timeout: 0 };
      var listResults = arr(ctx.listResults);

      for (var i = 0; i < listResults.length; i++) {
        var item = obj(listResults[i]);
        var st = str(item.status);

        if (st === 'listed') counts.listed++;
        else if (st === 'blocked') counts.blocked++;
        else if (st === 'unsupported') counts.unsupported++;
        else if (st === 'timeout') counts.timeout++;
        else if (st === 'clean') counts.checked++;
      }

      return {
        ip: str(ctx.ip),
        ipv6: ipFamily(str(ctx.ip)) === 'v6',
        trace: obj(ctx.trace),
        whois: obj(ctx.whois),
        info: obj(ctx.info),
        stackInfo: obj(ctx.stackInfo),
        workerData: worker,
        country: str(ctx.country),
        region: str(ctx.region),
        city: str(ctx.city),
        timezone: str(ctx.timezone),
        asn: str(ctx.asn),
        org: str(ctx.org),
        isp: str(ctx.isp),
        colo: str(ctx.colo),
        traceLoc: str(ctx.traceLoc),
        traceIp: str(ctx.traceIp),
        hostname: str(ctx.hostname),
        residential: ctx.residential === true,
        datacenter: ctx.datacenter === true,
        radarBot: typeof ctx.radarBot === 'number' && isFinite(ctx.radarBot) ? ctx.radarBot : null,
        geoList: arr(ctx.geoList),
        exitResults: arr(ctx.exitResults),
        webrtcLeak: ctx.webrtcLeak ? obj(ctx.webrtcLeak) : null,
        listResults: listResults,
        counts: counts,
        shodan: shodan ? {
          ok: true,
          ports: arr(shodan.ports),
          vulns: arr(shodan.vulns)
        } : null,
        abuse: abuse ? {
          ok: true,
          frequency: num(abuse.frequency),
          appears: num(abuse.appears)
        } : null,
        block: block ? {
          ok: block.ok === true,
          listed: block.listed === true,
          total: num(block.total)
        } : null
      };
    }

    function renderAll(rawContext) {
      if (destroyed) return;

      var ctx = normalizeContext(rawContext);
      var i;

      if (!ctx.country || !ctx.region || !ctx.city) {
        for (i = 0; i < ctx.geoList.length; i++) {
          var g = obj(ctx.geoList[i]);
          if (!ctx.country && g.country) ctx.country = str(g.country);
          if (!ctx.region && g.region) ctx.region = str(g.region);
          if (!ctx.city && g.city) ctx.city = str(g.city);
        }
      }

      var browserTz = '';

      try {
        browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      } catch (err) {
        browserTz = '';
      }

      var timezoneMatch = null;

      if (ctx.timezone && browserTz) {
        timezoneMatch = ctx.timezone === browserTz;
      }

      var coloCountry = ctx.colo ? ctx.traceLoc.toUpperCase() : '';
      var ipCountry = str(ctx.whois.country_code).toUpperCase();
      var anycast = coloCountry !== '' && ipCountry !== '' && coloCountry !== ipCountry;

      var proxySignals = [];

      if (str(ctx.trace.warp) === 'on') proxySignals.push('WARP');
      if (PROXY_PATTERN.test(ctx.org + ' ' + ctx.isp)) proxySignals.push('组织名含代理词');
      if (ctx.datacenter && timezoneMatch === false) proxySignals.push('机房出口与浏览器时区不符');
      if (ctx.datacenter && ctx.radarBot !== null && ctx.radarBot >= 50) proxySignals.push('机房出口与真实访客流量不符');

      var ipapi = ctx.workerData && ctx.workerData.ipapi ? obj(ctx.workerData.ipapi) : null;

      if (ipapi && ipapi.ok === true) {
        if (ipapi.hosting === true) ctx.datacenter = true;
        if (ipapi.proxy === true) proxySignals.push('代理定位已确认');
      }

      renderBasics({
        ip: ctx.ip,
        ipv6: ctx.ipv6,
        stackInfo: ctx.stackInfo,
        country: ctx.country,
        region: ctx.region,
        city: ctx.city,
        asn: ctx.asn,
        org: ctx.org,
        isp: ctx.isp,
        colo: ctx.colo,
        traceIp: ctx.traceIp,
        ipSource: judgeIpSourceText(ctx)
      });

      renderGeo(ctx.geoList);
      renderLists(ctx.listResults);

      renderRisks({
        datacenter: ctx.datacenter,
        residential: ctx.residential,
        radarBot: ctx.radarBot,
        proxySignals: proxySignals,
        counts: ctx.counts,
        shodan: ctx.shodan,
        abuse: ctx.abuse,
        block: ctx.block,
        hostname: ctx.hostname,
        ipv6: ctx.ipv6,
        anycast: anycast,
        dnsblNote: (ctx.ipv6 && str(ctx.stackInfo.v4))
          ? ('已改用 IPv4 ' + str(ctx.stackInfo.v4) + ' 查询')
          : ''
      });

      renderFingerprint(ctx.webrtcLeak);

      var asnConsistent = renderEnvironment({
        browserTz: browserTz,
        timezone: ctx.timezone,
        timezoneMatch: timezoneMatch,
        asn: ctx.asn,
        infoorg: str(ctx.info.org),
        org: ctx.org,
        browserLang: navigator.language || ''
      });

      var exitSummary = renderExits(ctx.exitResults);

      var scoreOptions = {
        datacenter: ctx.datacenter,
        residential: ctx.residential,
        radarBot: ctx.radarBot,
        proxyCount: proxySignals.length,
        listedCount: ctx.counts.unsupported === 0 ? ctx.counts.listed : 0,
        timezoneMatch: timezoneMatch,
        asnConsistent: asnConsistent,
        suspiciousHostname: ctx.hostname ? HOSTNAME_PATTERN.test(ctx.hostname) && !ctx.residential : false,
        abuseCount: ctx.abuse ? (ctx.abuse.frequency + ctx.abuse.appears) : 0,
        anycast: anycast,
        exitDistinct: exitSummary ? exitSummary.distinct : 0,
        blockListed: ctx.block ? ctx.block.listed : false
      };

      lastScoreOptions = scoreOptions;
      setScore(score(scoreOptions));
      setStatus('检测完成 · ' + new Date().toLocaleTimeString());
    }

    function judgeIpSourceText(ctx) {
      var regCountry = '';

      if (ctx.workerData) {
        if (ctx.workerData.cymru && ctx.workerData.cymru.ok && ctx.workerData.cymru.country) {
          regCountry = ctx.workerData.cymru.country;
        } else if (ctx.workerData.rdap && ctx.workerData.rdap.ok && ctx.workerData.rdap.country) {
          regCountry = ctx.workerData.rdap.country;
        }
      }

      var useCountry = ((ctx.whois && ctx.whois.country_code) || (ctx.info && ctx.info.country) || '').toUpperCase();

      if (!regCountry || !useCountry) return '无法判定';

      return regCountry === useCountry ? '原生 IP' : '广播 IP';
    }

    function onStart() {
      run();
    }

    startBtn.addEventListener('click', onStart);

    return {
      destroy: function () {
        destroyed = true;
        startBtn.removeEventListener('click', onStart);
      },
      __testRender: function (rawContext) {
        renderAll(rawContext);
      },
      __testNormalize: function (rawContext) {
        return normalizeContext(rawContext);
      }
    };
  }

  function initIpCheck() {
    const root = document.getElementById("vemiyIpCheck");
    if (!root) return;
    if (root.dataset.toolInit === "true") return;

    // 切页重入时销毁上一实例，避免事件监听重复绑定
    if (toolState.engine) {
      toolState.engine.destroy();
      toolState.engine = null;
    }

    root.dataset.toolInit = "true";
    toolState.engine = createIpCheck(root);
  }

  // 首屏加载与客户端路由切换后均执行初始化，函数内部保证幂等
  if (!window.__vemiyIpCheckBound) {
    window.__vemiyIpCheckBound = true;
    document.addEventListener("DOMContentLoaded", initIpCheck);
    document.addEventListener("astro:page-load", initIpCheck);
    document.addEventListener("pjax:complete", initIpCheck);
  }
  initIpCheck();
})();
