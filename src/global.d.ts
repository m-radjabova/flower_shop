declare module "*css";
declare module "*.scss";

declare module "*.svg" {
    const content: string;
    export default content;
}
declare module "*.png" {
    const content: string;
    export default content;
}

declare module "*.jpg" {
    const content: string;
    export default content;
}

declare module "*.json" {
    const content: Record<string, string>;
    export default content;
}