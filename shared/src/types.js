export var FighterType;
(function (FighterType) {
    FighterType["SHADOW_NINJA"] = "SHADOW_NINJA";
    FighterType["IRON_BOXER"] = "IRON_BOXER";
    FighterType["STREET_BRAWLER"] = "STREET_BRAWLER";
})(FighterType || (FighterType = {}));
export var ActionType;
(function (ActionType) {
    ActionType["MOVE_LEFT"] = "MOVE_LEFT";
    ActionType["MOVE_RIGHT"] = "MOVE_RIGHT";
    ActionType["JUMP"] = "JUMP";
    ActionType["PUNCH"] = "PUNCH";
    ActionType["KICK"] = "KICK";
    ActionType["SMASH"] = "SMASH";
    ActionType["BLOCK"] = "BLOCK";
    ActionType["SPECIAL"] = "SPECIAL";
    ActionType["STOP"] = "STOP"; // Stop horizontal movement
})(ActionType || (ActionType = {}));
