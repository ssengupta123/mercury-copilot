import {
  Search,
  FileText,
  Layers,
  RefreshCw,
  Calendar,
  Palette,
  Code,
  CheckCircle,
  GraduationCap,
  Rocket,
  Shield,
  BarChart3,
  Bot,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  FileText,
  Layers,
  RefreshCw,
  Calendar,
  Palette,
  Code,
  CheckCircle,
  GraduationCap,
  Rocket,
  Shield,
  BarChart3,
};

interface AgentIconProps {
  icon: string;
  className?: string;
  color?: string;
}

export function AgentIcon({ icon, className, color }: AgentIconProps) {
  const Icon = iconMap[icon] || Bot;
  return <Icon className={className} style={color ? { color } : undefined} />;
}
