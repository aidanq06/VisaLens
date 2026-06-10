import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

/**
 * Thin convenience wrapper over the shared Card primitives:
 * header (icon + title + optional right slot) plus body in one component.
 */
export default function SectionCard({
  title,
  subtitle,
  icon,
  right,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} icon={icon} right={right} />
      <CardBody className={bodyClassName}>{children}</CardBody>
    </Card>
  );
}
