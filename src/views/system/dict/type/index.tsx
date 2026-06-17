import * as React from "react"
import { ListIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { DictTypeResource } from "@/types/admin"
import { RESOURCE_CONFIGS } from "@/views/system/_components/resource/configs"
import { ResourceManager } from "@/views/system/_components/resource/manager"
import { DictDataListDialog } from "./dict-data-list-dialog"

export default function DictTypePage() {
  const [activeDictType, setActiveDictType] =
    React.useState<DictTypeResource | null>(null)

  return (
    <>
      <ResourceManager
        config={RESOURCE_CONFIGS["dict-types"]}
        renderInlineRowActions={(record) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveDictType(record)}
          >
            <ListIcon data-icon="inline-start" />
            列表
          </Button>
        )}
      />
      <DictDataListDialog
        key={activeDictType?.dict_type ?? "dict-data-dialog"}
        dictType={activeDictType}
        open={Boolean(activeDictType)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveDictType(null)
          }
        }}
      />
    </>
  )
}
