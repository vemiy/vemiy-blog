// 生成 /sitemap.xml：单分片输出网址列表，多分片输出索引。

import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import { resolveSiteRoot } from "./site-root";

const siteRoot = resolveSiteRoot();
const INDEX_FILE = path.join(siteRoot, "sitemap-index.xml");
const TARGET_FILE = path.join(siteRoot, "sitemap.xml");

async function main() {
	try {
		const shards = await glob("sitemap-[0-9]*.xml", { cwd: siteRoot });

		if (shards.length === 1) {
			const content = await fs.readFile(path.join(siteRoot, shards[0]), "utf-8");
			await fs.writeFile(TARGET_FILE, content, "utf-8");
			console.log(`Wrote ${TARGET_FILE} from ${shards[0]}`);
			return;
		}

		const content = await fs.readFile(INDEX_FILE, "utf-8");
		await fs.writeFile(TARGET_FILE, content, "utf-8");
		console.log(
			`Wrote ${TARGET_FILE} from sitemap-index.xml (${shards.length} shards)`,
		);
	} catch (error) {
		console.error("Failed to generate sitemap.xml:", error);
		process.exit(1);
	}
}

main();
