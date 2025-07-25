import * as React from "react"
import { Switch } from "./ui/switch"
import { cn } from "../lib/utils"

type SiteType = "allegro" | "gethome" | "nieruchomosci" | "olx" | "otodom"

interface SiteSwitchProps extends React.ComponentProps<typeof Switch> {
    site: SiteType
}

const getSiteColors = (site: SiteType) => {
    const colors = {
        allegro: "data-[state=checked]:bg-orange-500 focus-visible:border-orange-500 focus-visible:ring-orange-500/50",
        gethome: "data-[state=checked]:bg-purple-400 focus-visible:border-purple-400 focus-visible:ring-purple-400/50",
        nieruchomosci: "data-[state=checked]:bg-orange-600 focus-visible:border-orange-600 focus-visible:ring-orange-600/50",
        olx: "data-[state=checked]:bg-teal-400 focus-visible:border-teal-400 focus-visible:ring-teal-400/50",
        otodom: "data-[state=checked]:bg-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/50",
    }
    return colors[site]
}

function SiteSwitch({
    className,
    site,
    ...props
}: SiteSwitchProps) {
    return (
        <Switch
            className={cn(
                getSiteColors(site),
                className
            )}
            {...props}
        />
    )
}

export { SiteSwitch }