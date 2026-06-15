import { RESOURCE_CONFIGS } from "@/views/system/_components/resource/configs"
import { ResourceManager } from "@/views/system/_components/resource/manager"

export default function DictDataPage() {
  return <ResourceManager config={RESOURCE_CONFIGS["dict-data"]} />
}
