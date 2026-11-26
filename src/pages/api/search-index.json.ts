import { getSortedPosts } from "@/utils/content-utils";
import { getPostUrlBySlug } from "@/utils/url-utils";

/** 去除 Markdown 标记，保留可检索的正文文本 */
function toPlainText(markdown: string): string {
	return markdown
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/<[^>]+>/g, " ")
		.replace(/^#{1,6}\s+/gm, " ")
		.replace(/[*_~`>|-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export async function GET(): Promise<Response> {
	const posts = await getSortedPosts();

	const payload = posts
		.filter((post) => !post.data.draft && !post.data.password)
		.map((post) => ({
			url: getPostUrlBySlug(post.id),
			title: post.data.title,
			description: post.data.description || "",
			content: toPlainText(post.body || "").slice(0, 2000),
		}));

	return new Response(JSON.stringify(payload), {
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
}
