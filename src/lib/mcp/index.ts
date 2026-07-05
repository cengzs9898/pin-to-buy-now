import { defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import getProduct from "./tools/get-product";

export default defineMcp({
  name: "pintos-mcp",
  title: "Pintos Marketplace",
  version: "0.1.0",
  instructions:
    "Tools for browsing the Pintos marketplace. Use `list_products` to search or list active products, and `get_product` to fetch one by id.",
  tools: [listProducts, getProduct],
});
