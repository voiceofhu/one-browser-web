import { RESOURCE_CONFIGS } from "@/views/system/_components/resource/configs"
import { ResourceManager } from "@/views/system/_components/resource/manager"

export default function DeptPage() {
  return <ResourceManager config={RESOURCE_CONFIGS.depts} />
}
