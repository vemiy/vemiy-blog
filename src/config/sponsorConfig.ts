import type { SponsorConfig } from "../types/sponsorConfig";

export const sponsorConfig: SponsorConfig = {
	// 页面标题，留空则使用 i18n 中的翻译
	title: "",

	// 页面描述文本，留空则使用 i18n 中的翻译
	description: "",

	// 打赏用途说明
	usage: "",

	// 是否显示打赏者列表
	showSponsorsList: false,

	// 是否显示评论区
	showComment: false,

	// 是否在文章详情页底部显示打赏按钮
	showButtonInPost: false,

	// 打赏方式列表
	methods: [],

	// 打赏者列表
	sponsors: [],
};
