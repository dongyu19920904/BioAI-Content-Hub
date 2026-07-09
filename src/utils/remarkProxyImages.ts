import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const IMAGE_PROXY = "https://images.weserv.nl/?url=";

function shouldProxy(url: string): boolean {
  if (!url) return false;
  if (url.startsWith(IMAGE_PROXY)) return false;
  if (url.startsWith("//")) return true;
  return /^https?:\/\//i.test(url);
}

function normalizeUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

export const remarkProxyImages: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, "image", node => {
      if (!node || typeof node.url !== "string") return;
      const original = node.url.trim();
      if (!shouldProxy(original)) return;
      const normalized = normalizeUrl(original);
      node.url = `${IMAGE_PROXY}${encodeURIComponent(normalized)}`;
    });
  };
};
