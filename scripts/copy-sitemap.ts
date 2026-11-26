// 复制 sitemap 索引为 /sitemap.xml。

import fs from "node:fs/promises";
import path from "node:path";
import { resolveSiteRoot } from "./site-root";

const siteRoot = resolveSiteRoot();
const INDEX_FILE = path.join(siteRoot, "sitemap-index.xml");
const TARGET_FILE = path.join(siteRoot, "sitemap.xml");

async function main() {
	try {
		const content = await fs.readFile(INDEX_FILE, "utf-8");
		await fs.writeFile(TARGET_FILE, content, "utf-8");
		console.log(`Copied ${INDEX_FILE} to ${TARGET_FILE}`);
	} catch (error) {
		console.error(`Failed to copy sitemap index:`, error);
		process.exit(1);
	}
}

main();
