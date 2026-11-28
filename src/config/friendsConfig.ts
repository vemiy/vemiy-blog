import type {
	FriendGroup,
	FriendItem,
	FriendsPageConfig,
} from "../types/friendsConfig";

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: "",

	// 是否显示申请友链说明面板
	showCustomContent: true,

	// 是否显示评论区，需要先在commentConfig.ts启用评论系统
	showComment: true,

	// 是否开启随机排序配置，如果开启，就会忽略权重，构建时进行一次随机排序
	randomizeSort: false,
};

// 本站用于申请友链展示的信息
export const friendsSiteInfo = {
	name: "vemiyの小站",
	link: "https://www.vemiy.com",
	avatar: "https://www.vemiy.com/assets/images/avatar.webp",
	descr: "One more day.",
	rss: "https://www.vemiy.com/atom.xml",
};

// 申请友链须知
export const friendsApplyNotes: string[] = [
	"您已添加本站友链，并愿意长期保持互链。",
	"您的网站定位为个人博客，且不以商业推广为核心。",
	"您的网站以原创内容为主，符合中国大陆法律法规。",
];

// 申请友链留言模板
export const friendsApplyTemplate = `- name:
  link:
  avatar:
  descr:
  rss: `;

// 友链配置
// 每个数组项是一个分组，分组内的 items 是该分组下的友链条目
export const friendsConfig: FriendGroup[] = [
	{
		id: "friends",
		name: "友情链接",
		weight: 100,
		items: [
			{
				title: "晓空/宇风博客",
				siteurl: "https://www.xkyfzs.top/",
				imgurl: "https://tuchuang.xkyfzs.top/img/touxiang.jpg",
				desc: "我的认知，远远不能超过别人的认知，向别人学习，那才是我最高的认知！",
			},
			{
				title: "二叉树树",
				siteurl: "https://2x.nz/",
				imgurl: "https://q2.qlogo.cn/headimg_dl?dst_uin=2726730791&spec=0",
				desc: "AF Studio",
			},
			{
				title: "他说",
				siteurl: "https://090909.top/",
				imgurl: "https://090909.top/assets/images/logo.ico",
				desc: "梁栋烨的博客网站。",
			},
			{
				title: "桜鵞のすみか",
				siteurl: "https://retmon.cc",
				imgurl: "https://retmon.cc/pic/head.jpg",
				desc: "你开源的代码写的很不错，现在是我的了~",
			},
			{
				title: "MmzMing的知识库",
				siteurl: "https://tblog.mmzhiku.xyz/",
				imgurl: "https://tblog.mmzhiku.xyz/assets/images/aut-master.webp",
				desc: "哈基米，南北绿豆",
			},
			{
				title: "暖心向阳 335",
				siteurl: "https://nxxy335.top/",
				imgurl: "https://nxxy335.top/upload/logo.jpg",
				desc: "永不言败，砥砺前行",
			},
			{
				title: "风·墨",
				siteurl: "https://Vind.ink",
				imgurl: "https://Vind.ink/icon.png",
				desc: "风舞弦，墨凝影",
			},
			{
				title: "年华",
				siteurl: "https://blog.amamo.top",
				imgurl: "https://q1.qlogo.cn/g?b=qq&nk=1323860289&s=640",
				desc: "分享生活和技术。",
			},
			{
				title: "拾玖的博客",
				siteurl: "https://shijiucode.cn/",
				imgurl: "https://shijiucode.cn/avatar.jpg",
				desc: "喜欢折腾，尝试创作。",
			},
		],
	},
	{
		id: "orgs",
		name: "一些组织",
		weight: 90,
		items: [
			{
				title: "Blogroll",
				siteurl: "https://blogroll.online/",
				imgurl: "https://blogroll.online/favicon.ico",
				desc: "中文独立博客聚合列表",
			},
			{
				title: "BlogsClub",
				siteurl: "https://www.blogsclub.org/",
				imgurl:
					"https://images.weserv.nl/?url=www.blogsclub.org/usr/themes/default/favicon.png",
				desc: "互联网独立博客俱乐部",
			},
			{
				title: "有个站",
				siteurl: "https://www.ygz.ink/",
				imgurl: "https://www.ygz.ink/favicon.svg",
				desc: "独立博客书架，收录 149 个优质中文独立博客",
			},
		],
	},
	{
		id: "invalid",
		name: "失效链接",
		weight: 80,
		items: [
			{
				title: "小萝卜の博客",
				siteurl: "https://www.milobo.moe/",
				imgurl: "https://www.milobo.moe/myfile/milobo.webp",
				desc: "致瞬息万变之物，及亘古不变之物",
			},
		],
	},
];

// 获取启用的友链分组，按权重排序，组内条目同样按权重排序
export const getEnabledFriendGroups = (): FriendGroup[] => {
	const groups = friendsConfig
		.filter((group) => group.enabled !== false)
		.map((group) => ({
			...group,
			items: group.items
				.filter((item) => item.enabled !== false)
				.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)),
		}))
		.filter((group) => group.items.length > 0);

	if (friendsPageConfig.randomizeSort) {
		return groups.sort(() => Math.random() - 0.5);
	}

	return groups.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
};

// 获取全部启用的友链条目，用于计数与搜索
export const getEnabledFriends = (): FriendItem[] =>
	getEnabledFriendGroups().flatMap((group) => group.items);
