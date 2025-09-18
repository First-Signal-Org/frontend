import type { BentoItem } from "@/components/ui/bento-grid";

export const items: BentoItem[] = [
  {
    id: "1",
    type: "text",
    title: "Item 1",
    content: "This is the first item.",
    layout: { x: 0, y: 0, w: 2, h: 2 },
  },
  {
    id: "2",
    type: "text",
    title: "Item 2",
    content: "This is the second item.",
    layout: { x: 2, y: 0, w: 2, h: 2 },
  },
  {
    id: "3",
    type: "text",
    title: "Item 3",
    content: "This is the third item.",
    layout: { x: 4, y: 0, w: 2, h: 2 },
  },
  {
    id: "4",
    type: "text",
    title: "Item 4",
    content: "This is the fourth item.",
    layout: { x: 0, y: 2, w: 2, h: 2 },
  },
  {
    id: "5",
    type: "text",
    title: "Item 5",
    content: "This is the fifth item.",
    layout: { x: 2, y: 2, w: 2, h: 2 },
  },
];
