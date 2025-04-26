
import { memo } from "react";
import { ItemCardWrapper } from "./ItemCardWrapper";
import type { ItemCardProps } from "./types";

export const ItemCard = memo(function ItemCard(props: ItemCardProps) {
  return <ItemCardWrapper {...props} />;
});
