
interface ItemImageProps {
  image: string;
  title: string;
}

export function ItemImage({ image, title }: ItemImageProps) {
  return (
    <img
      src={image}
      alt={title}
      className="w-full h-48 object-cover rounded-t-lg"
    />
  );
}
