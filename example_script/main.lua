-- =========================================================================
-- Example script: drops a chosen item whenever it lands in the backpack and
-- shows a small counter overlay.
-- API reference: https://seqcoding.github.io/SafeRS-Native-Docs/
--
-- The top-level chunk runs once when the script is installed. Game logic
-- goes in script.onTick (once per game tick); drawing goes in script.draw.
-- =========================================================================

local util = require "lib.util"

script.declareInfo {
    name        = "Example Dropper",
    author      = "you",
    version     = "1.0.0",   -- keep in sync with safers.plugin.json
    description = "Drops the chosen item as soon as it lands in the backpack.",
}

script.declareSettings {
    groups = {
        { id = "general", title = "General", open = true, rows = {
            { id = "item", label = "Item to drop", kind = "text",
              value = "Shrimps", placeholder = "e.g. Shrimps", maxLength = 64 },
            { id = "overlay", label = "Show overlay", kind = "check", value = true },
        }},
    },
}

-- Settings arrive flattened as "<groupId>.<rowId>".
local item, showOverlay = "Shrimps", true
local held = 0   -- refreshed each tick; draw only reads it

local function apply(s)
    item = util.trim(s["general.item"] or item)
    if s["general.overlay"] ~= nil then showOverlay = s["general.overlay"] end
end

script.onSettingsChanged(apply)

-- Game logic (and every action) belongs in onTick.
script.onTick(function()
    if item == "" then return end
    held = srs.inventory.count(item)
    if held > 0 then srs.inventory.dropAll(item) end
end)

script.draw(function()
    if not showOverlay then return end
    if srs.draw.beginAnchoredOverlay("##example-dropper", 180, 32,
            srs.Corner.TopRight, -4, 4) then
        srs.draw.text(("Dropping %s (%d held)"):format(item, held))
        srs.draw.endOverlay()
    end
end)
