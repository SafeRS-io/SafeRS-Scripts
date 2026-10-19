-- Small helpers. Loaded from main.lua with require "lib.util".
local M = {}

function M.trim(s)
    return (tostring(s):gsub("^%s+", ""):gsub("%s+$", ""))
end

return M
