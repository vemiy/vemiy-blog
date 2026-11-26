<script lang="ts">
import Icon from "@/components/common/Icon.svelte";
import { siteConfig } from "@/config";
import iconsData from "@/constants/icons-data.json";
import { url as withBase } from "@/utils/url-utils";
import I18nKey from "../../i18n/i18nKey";
import { i18n } from "../../i18n/translation";

export let title: string;
export let author: string;
export let description = "";
export let pubDate: string;
export let coverImage: string | null = null;
export let coverImageSelector: string | null = null;
export let url: string;
export let siteTitle: string;
export let avatar: string | null = null;
export let avatarSelector: string | null = null;

let showModal = false;
let posterImage: string | null = null;
let generating = false;
/* 海报装饰色。 */
const themeColor = "#4b5563";
const headerTextColor = "#1f2937"; // 站点名称与 Logo 颜色

function loadImage(src: string): Promise<HTMLImageElement | null> {
	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => {
			if (!src.includes("images.weserv.nl")) {
				const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(src)}&output=png`;
				const proxyImg = new Image();
				proxyImg.crossOrigin = "anonymous";
				proxyImg.onload = () => resolve(proxyImg);
				proxyImg.onerror = () => {
					resolve(null);
				};
				proxyImg.src = proxyUrl;
			} else {
				resolve(null);
			}
		};
		img.src = src;
	});
}

function resolveImageSource(
	src: string | null,
	selector: string | null,
): string | null {
	if (!selector) return src;
	const image = document.querySelector<HTMLImageElement>(selector);
	return image?.currentSrc || image?.src || src;
}

// 解析站点 Logo 来源。
function serializeNavbarIcon(color: string, size: number): string | null {
	const svg = document.querySelector<SVGSVGElement>("#navbar svg.navbar-logo");
	if (!svg) return null;

	const clone = svg.cloneNode(true) as SVGSVGElement;
	clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
	// 设置图标尺寸。
	clone.setAttribute("width", String(size));
	clone.setAttribute("height", String(size));
	clone.removeAttribute("class");
	// 设置图标颜色。
	clone.setAttribute("style", `color:${color}`);

	const markup = new XMLSerializer().serializeToString(clone);
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

function buildIconDataUrl(icon: string, color: string): string | null {
	const [prefix, name] = icon.split(":");
	if (!prefix || !name) return null;

	const collection = (
		iconsData as Record<
			string,
			{
				icons?: Record<string, { body: string }>;
				width?: number;
				height?: number;
			}
		>
	)[prefix];
	const body = collection?.icons?.[name]?.body;
	if (!body) return null;

	const iconWidth = collection.width ?? 24;
	const iconHeight = collection.height ?? 24;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconWidth}" height="${iconHeight}" viewBox="0 0 ${iconWidth} ${iconHeight}">${body.replaceAll("currentColor", color)}</svg>`;

	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function resolveSiteLogoSource(color: string, size: number): string | null {
	const logo = siteConfig.navbar.logo;
	if (!logo?.value) return null;

	if (logo.type === "icon") {
		// 优先取导航栏 SVG。
		return (
			serializeNavbarIcon(color, size) ?? buildIconDataUrl(logo.value, color)
		);
	}

	// src 目录下的图片经 Astro 优化后只有导航栏能拿到最终地址
	// 海报背景是白色，因此固定取亮色版本的 Logo
	const navbarLogo =
		document.querySelector<HTMLImageElement>(
			'#navbar img.navbar-logo[data-logo-theme="light"]',
		) ?? document.querySelector<HTMLImageElement>("#navbar img.navbar-logo");
	const navbarLogoSrc = navbarLogo?.currentSrc || navbarLogo?.src;
	if (navbarLogoSrc) return navbarLogoSrc;

	if (logo.type === "url") return logo.value;
	// public 目录下的图片可直接拼接 base 路径，src 目录下的则无法在客户端还原
	return logo.value.startsWith("/") || logo.value.startsWith("http")
		? withBase(logo.value)
		: null;
}

function getLines(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
): string[] {
	const chars = text.split("");
	const lines: string[] = [];
	let currentLine = "";

	for (let i = 0; i < chars.length; i++) {
		const char = chars[i];
		const width = ctx.measureText(currentLine + char).width;
		if (width < maxWidth) {
			currentLine += char;
		} else {
			lines.push(currentLine);
			currentLine = char;
		}
	}
	if (currentLine) {
		lines.push(currentLine);
	}
	return lines;
}

function fitText(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
): string {
	if (ctx.measureText(text).width <= maxWidth) return text;

	const ellipsis = "...";
	const fittedChars = Array.from(text);
	while (
		fittedChars.length > 0 &&
		ctx.measureText(`${fittedChars.join("")}${ellipsis}`).width > maxWidth
	) {
		fittedChars.pop();
	}

	return fittedChars.length > 0
		? `${fittedChars.join("")}${ellipsis}`
		: ellipsis;
}

function drawRoundedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
) {
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
}

async function generatePoster() {
	showModal = true;
	if (posterImage) return;

	generating = true;
	try {
		// 按需加载二维码库。
		const { default: QRCode } = await import("qrcode");
		const scale = 2;
		const width = 425 * scale;
		const padding = 24 * scale;
		const logoBox = 22 * scale; // 站点 Logo 尺寸

		// 准备资源。
		const qrCodeUrl = await QRCode.toDataURL(url, {
			margin: 1,
			width: 100 * scale,
			color: { dark: "#000000", light: "#ffffff" },
		});
		const resolvedCoverImage = resolveImageSource(
			coverImage,
			coverImageSelector,
		);
		const resolvedAvatar = resolveImageSource(avatar, avatarSelector);
		const resolvedSiteLogo = resolveSiteLogoSource(headerTextColor, logoBox);
		const [qrImg, coverImg, avatarImg, logoImg] = await Promise.all([
			loadImage(qrCodeUrl),
			resolvedCoverImage
				? loadImage(resolvedCoverImage)
				: Promise.resolve(null),
			resolvedAvatar ? loadImage(resolvedAvatar) : Promise.resolve(null),
			resolvedSiteLogo ? loadImage(resolvedSiteLogo) : Promise.resolve(null),
		]);

		// 初始化画布。
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Canvas context not available");

		canvas.width = width;
		// 初始高度。
		canvas.height = 1000 * scale;

		// 计算布局。
		const contentWidth = width - padding * 2;
		let currentY = 0;

		// 封面。
		const coverHeight = (coverImg ? 200 : 64) * scale;
		currentY += coverHeight;
		currentY += padding; // Gap after cover

		// 标题。
		ctx.font = `700 ${24 * scale}px 'Roboto', sans-serif`;
		const titleLines = getLines(ctx, title, contentWidth);
		const titleLineHeight = 30 * scale;
		const titleHeight = titleLines.length * titleLineHeight;
		currentY += titleHeight;
		currentY += 16 * scale; // Gap

		// 描述。
		let descHeight = 0;
		if (description) {
			ctx.font = `${14 * scale}px 'Roboto', sans-serif`;
			const descLines = getLines(ctx, description, contentWidth - 16 * scale); // minus border width and gap
			// 描述最多六行。
			const maxDescLines = 6;
			const displayDescLines = descLines.slice(0, maxDescLines);
			const descLineHeight = 25 * scale; // 1.8 line-height approx
			descHeight = displayDescLines.length * descLineHeight;
			currentY += descHeight;
			// currentY += 24 * scale; // Gap to footer (Removed to reduce whitespace)
		} else {
			currentY += 8 * scale; // Smaller gap if no desc
		}

		// 页脚。
		// 分隔线间距。
		currentY += 16 * scale;
		const footerHeight = 80 * scale; // 页脚高度。
		currentY += footerHeight;
		currentY += 12 * scale; // 底部内边距。

		// 调整画布高度。
		canvas.height = currentY;

		// 绘制内容。
		// 填充底色。
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// 绘制装饰圆。
		ctx.save();
		ctx.globalAlpha = 0.1;
		ctx.fillStyle = themeColor;

		// 右上圆。
		// 右上圆位置。
		// 右上圆半径。
		// 右上圆圆心 X。
		// 右上圆圆心 Y。
		ctx.beginPath();
		ctx.arc(width - 25 * scale, 25 * scale, 75 * scale, 0, Math.PI * 2);
		ctx.fill();

		// 左下圆。
		// 左下圆位置。
		ctx.beginPath();
		ctx.arc(10 * scale, canvas.height - 10 * scale, 50 * scale, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();

		// 解析日期。
		let dateObj: { day: string; month: string; year: string } | null = null;
		try {
			const d = new Date(pubDate);
			if (!Number.isNaN(d.getTime())) {
				dateObj = {
					day: d.getDate().toString().padStart(2, "0"),
					month: (d.getMonth() + 1).toString().padStart(2, "0"),
					year: d.getFullYear().toString(),
				};
			}
		} catch (e) {}

		// 绘制封面。
		if (coverImg) {
			// 封面裁切。
			const imgRatio = coverImg.width / coverImg.height;
			const targetRatio = width / coverHeight;
			let sx: number;
			let sy: number;
			let sWidth: number;
			let sHeight: number;

			if (imgRatio > targetRatio) {
				sHeight = coverImg.height;
				sWidth = sHeight * targetRatio;
				sx = (coverImg.width - sWidth) / 2;
				sy = 0;
			} else {
				sWidth = coverImg.width;
				sHeight = sWidth / targetRatio;
				sx = 0;
				sy = (coverImg.height - sHeight) / 2;
			}
			ctx.drawImage(
				coverImg,
				sx,
				sy,
				sWidth,
				sHeight,
				0,
				0,
				width,
				coverHeight,
			);
		} else {
			ctx.save();
			ctx.fillStyle = themeColor;
			ctx.globalAlpha = 0.2;
			ctx.fillRect(0, 0, width, coverHeight);
			ctx.restore();
		}

		// 绘制页头。
		const headerHeight = (coverImg ? 44 : 64) * scale;
		const headerCenterY = headerHeight / 2;
		const dateText = dateObj
			? `${dateObj.year}.${dateObj.month}.${dateObj.day}`
			: "";

		ctx.fillStyle = "rgba(255, 255, 255, 0.76)";
		ctx.fillRect(0, 0, width, headerHeight);

		ctx.textAlign = "right";
		ctx.textBaseline = "middle";
		ctx.fillStyle = "rgba(31, 41, 55, 0.68)";
		ctx.font = `${11 * scale}px 'Roboto', sans-serif`;
		const dateWidth = dateText ? ctx.measureText(dateText).width : 0;
		if (dateText) {
			ctx.fillText(dateText, width - padding, headerCenterY);
		}

		ctx.textAlign = "left";
		ctx.fillStyle = headerTextColor;
		ctx.font = `700 ${16 * scale}px 'Roboto', sans-serif`;

		// 站点 Logo，效果对齐导航栏：Logo 在前，标题紧随其后
		const logoGap = 8 * scale;
		let logoW = 0;
		let logoH = 0;
		if (logoImg) {
			const ratio =
				logoImg.width && logoImg.height ? logoImg.width / logoImg.height : 1;
			logoW = ratio >= 1 ? logoBox : logoBox * ratio;
			logoH = ratio >= 1 ? logoBox / ratio : logoBox;
		}
		const siteTitleX = logoImg ? padding + logoW + logoGap : padding;

		const siteTitleText = fitText(
			ctx,
			siteTitle,
			contentWidth -
				(siteTitleX - padding) -
				(dateWidth > 0 ? dateWidth + 16 * scale : 0),
		);

		if (logoImg) {
			// 按字形高度居中。
			const metrics = ctx.measureText(siteTitleText);
			const ascent = metrics.actualBoundingBoxAscent;
			const descent = metrics.actualBoundingBoxDescent;
			const titleCenterY =
				Number.isFinite(ascent) && Number.isFinite(descent)
					? headerCenterY + (descent - ascent) / 2
					: headerCenterY;
			ctx.drawImage(logoImg, padding, titleCenterY - logoH / 2, logoW, logoH);
		}

		ctx.fillText(siteTitleText, siteTitleX, headerCenterY);

		// 重置绘制起点。
		let drawY = coverHeight + padding;

		// 绘制标题。
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		ctx.font = `700 ${24 * scale}px 'Roboto', sans-serif`;
		ctx.fillStyle = "#111827";
		titleLines.forEach((line) => {
			ctx.fillText(line, padding, drawY);
			drawY += titleLineHeight;
		});
		drawY += 16 * scale - (titleLineHeight - 24 * scale); // Adjust for line-height diff

		// 绘制描述。
		if (description) {
			// 绘制竖线。
			ctx.fillStyle = "#e5e7eb";
			const descLineH = descHeight; // Approximate
			// 竖线延伸。
			drawRoundedRect(
				ctx,
				padding,
				drawY - 8 * scale,
				4 * scale,
				descLineH + 8 * scale,
				2 * scale,
			);
			ctx.fill();

			ctx.font = `${14 * scale}px 'Roboto', sans-serif`;
			ctx.fillStyle = "#4b5563";
			const descLines = getLines(ctx, description, contentWidth - 16 * scale);
			const maxDescLines = 6;

			descLines.slice(0, maxDescLines).forEach((line) => {
				ctx.fillText(line, padding + 16 * scale, drawY);
				drawY += 25 * scale; // 行高。
			});
			// drawY += 24 * scale; // 省略间距。
		} else {
			drawY += 8 * scale;
		}

		// 绘制分隔线。
		drawY += 8 * scale; // 分隔线前间距。
		ctx.beginPath();
		ctx.strokeStyle = "#f3f4f6";
		ctx.lineWidth = 1 * scale;
		ctx.moveTo(padding, drawY);
		ctx.lineTo(width - padding, drawY);
		ctx.stroke();
		drawY += 8 * scale; // 分隔线后间距。

		// 绘制页脚。
		const footerY = drawY;
		const qrSize = 64 * scale;
		const qrX = width - padding - qrSize;
		const authorY = footerY + 8 * scale;

		// 作者区。
		if (avatarImg) {
			ctx.save();
			const avatarSize = 64 * scale;
			const avatarX = padding;

			// 头像圆形裁切。
			ctx.beginPath();
			ctx.arc(
				avatarX + avatarSize / 2,
				authorY + avatarSize / 2,
				avatarSize / 2,
				0,
				Math.PI * 2,
			);
			ctx.closePath();
			ctx.clip();

			ctx.drawImage(avatarImg, avatarX, authorY, avatarSize, avatarSize);
			ctx.restore();

			// 头像描边。
			ctx.beginPath();
			ctx.arc(
				avatarX + (64 * scale) / 2,
				authorY + (64 * scale) / 2,
				(64 * scale) / 2,
				0,
				Math.PI * 2,
			);
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 2 * scale;
			ctx.stroke();
		}

		const authorTextX =
			padding + (resolvedAvatar ? 64 * scale + 16 * scale : 0);
		const authorMaxWidth = qrX - 24 * scale - authorTextX;
		const textCenterY = authorY + 32 * scale;

		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillStyle = "#9ca3af";
		ctx.font = `${12 * scale}px 'Roboto', sans-serif`;
		ctx.fillText(i18n(I18nKey.author), authorTextX, textCenterY - 20 * scale);

		ctx.fillStyle = "#1f2937";
		ctx.font = `700 ${20 * scale}px 'Roboto', sans-serif`;
		ctx.fillText(
			fitText(ctx, author, authorMaxWidth),
			authorTextX,
			textCenterY + 4 * scale,
		);

		// 二维码区。
		// 二维码底色。
		ctx.fillStyle = "#ffffff";
		// 二维码浅阴影。
		ctx.shadowColor = "rgba(0, 0, 0, 0.05)";
		ctx.shadowBlur = 4 * scale;
		ctx.shadowOffsetY = 2 * scale;
		drawRoundedRect(ctx, qrX, footerY, qrSize, qrSize, 4 * scale);
		ctx.fill();
		ctx.shadowColor = "transparent"; // Reset shadow

		// 绘制二维码。
		const qrInnerSize = 56 * scale;
		const qrPadding = (qrSize - qrInnerSize) / 2;
		if (qrImg) {
			ctx.drawImage(
				qrImg,
				qrX + qrPadding,
				footerY + qrPadding,
				qrInnerSize,
				qrInnerSize,
			);
		}

		// 二维码说明。
		ctx.textAlign = "center";
		ctx.textBaseline = "top";
		ctx.fillStyle = "#9ca3af";
		ctx.font = `${10 * scale}px 'Roboto', sans-serif`;
		ctx.fillText(
			fitText(ctx, i18n(I18nKey.scanToRead), qrSize),
			qrX + qrSize / 2,
			footerY + qrSize + 6 * scale,
		);

		// 输出海报。
		posterImage = canvas.toDataURL("image/png");
		generating = false;
	} catch (error) {
		console.error("Failed to generate poster:", error);
		generating = false;
	}
}

function downloadPoster() {
	if (posterImage) {
		const a = document.createElement("a");
		a.href = posterImage;
		a.download = `poster-${title.replace(/\s+/g, "-")}.png`;
		a.click();
	}
}

function closeModal() {
	showModal = false;
}

let copied = false;
function copyLink() {
	navigator.clipboard.writeText(url);
	copied = true;
	setTimeout(() => {
		copied = false;
	}, 2000);
}

function portal(node: HTMLElement) {
	document.body.appendChild(node);
	return {
		destroy() {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		},
	};
}
</script>

<!-- Trigger Button -->
<button
  class="share-trigger"
  on:click={generatePoster}
  aria-label="Generate Share Poster"
>
  <Icon icon="material-symbols:share" />
  <span>{i18n(I18nKey.shareArticle)}</span>
</button>

<!-- Modal -->
{#if showModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div use:portal class="share-overlay" on:click={closeModal} on:keydown={(e) => e.key === "Escape" && closeModal()} role="presentation">
    <div class="share-dialog" on:click={(e) => e.stopPropagation()} role="presentation">
      <div class="share-dialog__preview">
        {#if posterImage}
          <img src={posterImage} alt="Poster" class="share-dialog__image" />
        {:else}
          <div class="share-dialog__loading">
            <div class="share-dialog__spinner"></div>
            <span>{i18n(I18nKey.generatingPoster)}</span>
          </div>
        {/if}
      </div>

      <div class="share-dialog__actions">
        <button class="share-dialog__btn" on:click={copyLink}>
          {#if copied}
            <Icon icon="material-symbols:check" />
            <span>{i18n(I18nKey.copied)}</span>
          {:else}
            <Icon icon="material-symbols:link" />
            <span>{i18n(I18nKey.copyLink)}</span>
          {/if}
        </button>
        <button
          class="share-dialog__btn share-dialog__btn--accent"
          on:click={downloadPoster}
          disabled={!posterImage}
        >
          <Icon icon="material-symbols:download" />
          {i18n(I18nKey.savePoster)}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* 分享按钮：透明底 + 2px 描边 + 4px 圆角，无位移无阴影 */
  .share-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    height: 2.75rem;
    padding: 0 1.25rem;
    border: 2px solid var(--line-color);
    border-radius: var(--app-radius-card, 0.25rem);
    background: transparent;
    color: var(--content-meta);
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
  }

  .share-trigger:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  .share-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.7);
  }

  .share-dialog {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 28rem;
    max-height: 90vh;
    overflow-y: auto;
    border: 2px solid var(--line-color);
    border-radius: var(--app-radius-card, 0.25rem);
    background: var(--card-bg);
  }

  .share-dialog__preview {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 12rem;
    padding: 1.5rem;
  }

  .share-dialog__image {
    max-width: 100%;
    height: auto;
    border-radius: var(--app-radius-card, 0.25rem);
  }

  .share-dialog__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    color: var(--content-meta);
    font-size: 0.875rem;
  }

  .share-dialog__spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid var(--line-color);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: share-spin 0.8s linear infinite;
  }

  @keyframes share-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .share-dialog__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    padding: 1rem;
    border-top: 2px solid var(--line-color);
  }

  .share-dialog__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 2px solid var(--line-color);
    border-radius: var(--app-radius-card, 0.25rem);
    background: transparent;
    color: var(--content-meta);
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
  }

  .share-dialog__btn:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  .share-dialog__btn--accent {
    border-color: var(--primary);
    color: var(--primary);
  }

  .share-dialog__btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .share-dialog__btn:disabled:hover {
    border-color: var(--line-color);
    color: var(--content-meta);
  }
</style>
