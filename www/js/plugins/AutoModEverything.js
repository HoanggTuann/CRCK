// =============================================================================
// AutoModEverything.js for Cute.Broke.and.Dungeon.Bound (ssed)
// =============================================================================
/*:
 * @plugindesc Auto-mod 999999 gold, max lust, memory room unlock and new game bonuses.
 * @author Assistant
 */
(() => {
    "use strict";

    // 1. Min gold 999999 guaranteed
    const _Game_Party_gold = Game_Party.prototype.gold;
    Game_Party.prototype.gold = function() {
        if (!this._gold || this._gold < 999999) {
            this._gold = 999999;
        }
        return this._gold;
    };

    const _Game_Party_loseGold = Game_Party.prototype.loseGold;
    Game_Party.prototype.loseGold = function(amount) {
        _Game_Party_loseGold.apply(this, arguments);
        if (this._gold < 999999) {
            this._gold = 999999;
        }
    };

    // 2. Always Max Lewdness (Var 8: Memelis, Var 16: Tina)
    const _Game_Variables_value = Game_Variables.prototype.value;
    Game_Variables.prototype.value = function(variableId) {
        if (variableId === 8 || variableId === 16) {
            return 100;
        }
        if (variableId === 24) {
            return 999999;
        }
        return _Game_Variables_value.apply(this, arguments);
    };

    // 3. New Game Auto-Setup
    const _DataManager_setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        _DataManager_setupNewGame.apply(this, arguments);
        try {
            // Gold
            $gameParty._gold = 999999;

            // Lust / Variables
            $gameVariables.setValue(1, 50);   // Memelis masturbation
            $gameVariables.setValue(8, 100);  // Memelis Lewdness max
            $gameVariables.setValue(9, 50);   // Tina masturbation
            $gameVariables.setValue(16, 100); // Tina Lewdness max
            $gameVariables.setValue(24, 999999);
            $gameVariables.setValue(26, 4);   // Max Title image stage (0-4)
            $gameVariables.setValue(28, 1);   // True ending picture

            // Unlocks: Memory Room, Extra Scenarios, Endings (in Memory Room)
            $gameSwitches.setValue(13, true);  // Memory room unlock
            $gameSwitches.setValue(148, true); // Memory room path in Banquet Village
            $gameSwitches.setValue(164, true); // Normal end scene unlock
            $gameSwitches.setValue(165, true); // Bad end scene unlock
            $gameSwitches.setValue(166, true); // True end scene unlock
            $gameSwitches.setValue(181, true); // Additional scenario unlock

            // Stock starting items & equipment
            if ($dataItems) {
                for (let i = 1; i < Math.min($dataItems.length, 50); i++) {
                    const item = $dataItems[i];
                    if (item && item.name) {
                        $gameParty.gainItem(item, 20);
                    }
                }
            }
            if ($dataWeapons) {
                for (let i = 1; i < Math.min($dataWeapons.length, 30); i++) {
                    const w = $dataWeapons[i];
                    if (w && w.name) {
                        $gameParty.gainItem(w, 5);
                    }
                }
            }
            if ($dataArmors) {
                for (let i = 1; i < Math.min($dataArmors.length, 40); i++) {
                    const a = $dataArmors[i];
                    if (a && a.name) {
                        $gameParty.gainItem(a, 5);
                    }
                }
            }
        } catch (e) {
            console.error("AutoMod setupNewGame error:", e);
        }
    };

    // 4. Save Load Auto-Setup
    const _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _DataManager_extractSaveContents.apply(this, arguments);
        try {
            if ($gameParty) {
                if (!$gameParty._gold || $gameParty._gold < 999999) {
                    $gameParty._gold = 999999;
                }
            }
            if ($gameVariables) {
                $gameVariables.setValue(8, 100);
                $gameVariables.setValue(16, 100);
                $gameVariables.setValue(24, 999999);
                $gameVariables.setValue(26, 4);
                $gameVariables.setValue(28, 1);
            }
            if ($gameSwitches) {
                $gameSwitches.setValue(13, true);
                $gameSwitches.setValue(148, true);
                $gameSwitches.setValue(164, true);
                $gameSwitches.setValue(165, true);
                $gameSwitches.setValue(166, true);
                $gameSwitches.setValue(181, true);
            }
        } catch (e) {
            console.error("AutoMod extractSaveContents error:", e);
        }
    };

    // 5. Memory Room entrance guard
    const _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        _Scene_Map_onMapLoaded.apply(this, arguments);
        try {
            if ($gameSwitches) {
                if (!$gameSwitches.value(148)) $gameSwitches.setValue(148, true);
                if (!$gameSwitches.value(13)) $gameSwitches.setValue(13, true);
                if (!$gameSwitches.value(181)) $gameSwitches.setValue(181, true);
            }
            if ($gameParty && $gameParty.gold() < 999999) {
                $gameParty._gold = 999999;
            }
        } catch (e) {
            console.error("AutoMod onMapLoaded error:", e);
        }
    };
})();
