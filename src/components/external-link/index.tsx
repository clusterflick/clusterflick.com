import { type ComponentProps } from "react";
import Link from "next/link";

const ExternalLink = (props: ComponentProps<typeof Link>) => (
  <Link {...props} rel="noreferrer" target="_blank" />
);

export default ExternalLink;
