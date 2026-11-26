// 友链配置

// 单个友链条目
export type FriendItem = {
	title: string; // 站点名称
	siteurl: string; // 站点地址
	imgurl: string; // 头像地址
	desc?: string; // 站点简介
	weight?: number; // 组内权重，数字越大排序越靠前，默认 0
	enabled?: boolean; // 是否启用，默认 true
};

// 友链分组
export type FriendGroup = {
	id: string; // 分组唯一标识，用作锚点 id
	name: string; // 分组名称
	desc?: string; // 分组描述
	weight?: number; // 分组权重，数字越大排序越靠前，默认 0
	enabled?: boolean; // 是否启用，默认 true
	items: FriendItem[]; // 分组内的友链列表
};

// 友链页面配置
export type FriendsPageConfig = {
	title?: string; // 页面标题，留空则使用 i18n 中的翻译
	description?: string; // 页面描述，留空则使用 i18n 中的翻译
	showCustomContent?: boolean; // 是否显示申请友链说明面板
	showComment?: boolean; // 是否显示评论区，默认 true
	randomizeSort?: boolean; // 是否打乱排序，如果为 true，将忽略 weight，随机排序
};
