//=============================================================================
// MobileControlsAndTouchFix.js
//=============================================================================
/*:
 * @plugindesc Bàn phím ảo cảm ứng (Cần gạt Joystick), chạy toggle và tối ưu chạm 1 chạm cho điện thoại (Android & iOS).
 * @author Assistant
 *
 * @help
 * Plugin này giải quyết toàn diện tương tác trên điện thoại di động:
 * 1. Cần gạt ảo (Virtual Analog Joystick):
 *    - Điều khiển di chuyển 8 hướng mượt mà, trực quan thay cho cụm phím 4 nút D-Pad.
 *    - Cần gạt tự động đàn hồi về tâm khi thả tay.
 * 2. Nút "CHẠY" chuyển trạng thái BẬT / TẮT (Toggle Dash):
 *    - Chạm 1 lần để bật tự động chạy liên tục (🏃 BẬT - sáng đèn vàng cam).
 *    - Chạm lại để tắt (quay về đi bộ bình thường). Không cần phải giữ lì ngón tay!
 * 3. Chuyển đổi nhân vật tiện lợi trong Equips / Skill / Status / H Status:
 *    - Thêm 2 phím ảo [◀ Q] và [E ▶] ngay trên màn hình.
 *    - Hỗ trợ phím vật lý Q (PageUp) và E/W (PageDown) trên bàn phím ngoài.
 *    - Chạm trực tiếp vào khung chân dung/thông số nhân vật để đổi nhân vật ngay lập tức.
 *    - Đổi nhân vật ngay cả khi đang duyệt danh sách slot trang bị hoặc danh sách kỹ năng.
 * 4. Tương tác chạm 1 chạm (1-Tap): Chạm trực tiếp vào bất kỳ mục menu nào sẽ lập tức chọn và xác nhận.
 * 5. Căn chỉnh toạ độ chạm pixel-perfect qua getBoundingClientRect.
 * 6. Hỗ trợ cảm ứng & chuột cho Menu tranh tùy biến (Custom Picture Menu).
 */

(function() {
    "use strict";

    var isPadVisible = true;
    var isDashActive = false; // Trạng thái chạy tự động (Toggle)
    var isEditMode = false;   // Chế độ kéo thả chỉnh vị trí phím ảo

    try {
        // Gán phím vật lý E (69) và Q (81) vào hệ thống PageDown / PageUp của RPG Maker
        if (typeof Input !== 'undefined' && Input.keyMapper) {
            Input.keyMapper[69] = 'pagedown'; // Phím E = Đổi nhân vật kế tiếp (Next Actor)
            Input.keyMapper[81] = 'pageup';   // Phím Q = Đổi nhân vật trước (Previous Actor)
            Input.keyMapper[87] = 'pagedown'; // Phím W = Đổi nhân vật kế tiếp
        }

        // Hook Game_Player để khi isDashActive bật thì nhân vật luôn chạy
        if (typeof Game_Player !== 'undefined' && Game_Player.prototype) {
            var _Game_Player_isDashButtonPressed = Game_Player.prototype.isDashButtonPressed;
            Game_Player.prototype.isDashButtonPressed = function() {
                if (isDashActive) return true;
                return _Game_Player_isDashButtonPressed ? _Game_Player_isDashButtonPressed.call(this) : false;
            };
        }
    } catch (e) {
        console.error("Init keyMapper/Game_Player error:", e);
    }

    // =========================================================================
    // 1. SỬA TOẠ ĐỘ CHẠM & TƯƠNG TÁC CHẠM 1 CHẠM (1-TAP SELECTION)
    // =========================================================================

    try {
        if (typeof Graphics !== 'undefined') {
            Graphics.pageToCanvasX = function(x) {
                if (this._canvas) {
                    var rect = this._canvas.getBoundingClientRect();
                    return Math.round((x - rect.left) * (this._width / rect.width));
                }
                return 0;
            };

            Graphics.pageToCanvasY = function(y) {
                if (this._canvas) {
                    var rect = this._canvas.getBoundingClientRect();
                    return Math.round((y - rect.top) * (this._height / rect.height));
                }
                return 0;
            };
        }

        if (typeof Window_Selectable !== 'undefined' && Window_Selectable.prototype) {
            var _Window_Selectable_onTouch = Window_Selectable.prototype.onTouch;
            Window_Selectable.prototype.onTouch = function(triggered) {
                var lastIndex = this.index();
                var x = this.canvasToLocalX(TouchInput.x);
                var y = this.canvasToLocalY(TouchInput.y);
                var hitIndex = this.hitTest(x, y);

                if (hitIndex >= 0) {
                    if (triggered) {
                        this.select(hitIndex);
                        if (this.isTouchOkEnabled()) {
                            this.processOk();
                        }
                    } else if (this.isCursorMovable()) {
                        this.select(hitIndex);
                    }
                } else if (this._stayCount >= 10) {
                    if (y < this.padding) {
                        this.cursorUp();
                    } else if (y >= this.height - this.padding) {
                        this.cursorDown();
                    }
                }
                if (this.index() !== lastIndex) {
                    SoundManager.playCursor();
                }
            };
        }
    } catch (e) {
        console.error("1-tap touch init error:", e);
    }

    // =========================================================================
    // 2. HỖ TRỢ CHUYỂN ĐỔI NHÂN VẬT TIỆN LỢI TRONG MENU (EQUIP, SKILL, STATUS, H STATUS)
    // =========================================================================

    try {
        // [Scene_Equip]
        if (typeof Scene_Equip !== 'undefined' && Scene_Equip.prototype) {
            var _Scene_Equip_createSlotWindow = Scene_Equip.prototype.createSlotWindow;
            Scene_Equip.prototype.createSlotWindow = function() {
                if (_Scene_Equip_createSlotWindow) _Scene_Equip_createSlotWindow.call(this);
                if (this._slotWindow) {
                    this._slotWindow.setHandler('pagedown', this.nextActor.bind(this));
                    this._slotWindow.setHandler('pageup',   this.previousActor.bind(this));
                }
            };

            var _Scene_Equip_createItemWindow = Scene_Equip.prototype.createItemWindow;
            Scene_Equip.prototype.createItemWindow = function() {
                if (_Scene_Equip_createItemWindow) _Scene_Equip_createItemWindow.call(this);
                if (this._itemWindow) {
                    this._itemWindow.setHandler('pagedown', this.nextActor.bind(this));
                    this._itemWindow.setHandler('pageup',   this.previousActor.bind(this));
                }
            };

            var _Scene_Equip_onActorChange = Scene_Equip.prototype.onActorChange;
            Scene_Equip.prototype.onActorChange = function() {
                var wasSlotActive = this._slotWindow && this._slotWindow.active;
                var slotIndex = this._slotWindow ? this._slotWindow.index() : 0;
                if (_Scene_Equip_onActorChange) _Scene_Equip_onActorChange.call(this);
                if (wasSlotActive && this._slotWindow) {
                    if (this._commandWindow) this._commandWindow.deactivate();
                    this._slotWindow.activate();
                    this._slotWindow.select(slotIndex);
                }
            };

            var _Scene_Equip_update = Scene_Equip.prototype.update;
            Scene_Equip.prototype.update = function() {
                if (_Scene_Equip_update) {
                    _Scene_Equip_update.call(this);
                } else if (Scene_MenuBase.prototype.update) {
                    Scene_MenuBase.prototype.update.call(this);
                }
                if (TouchInput.isTriggered() && this._statusWindow && this.isActive()) {
                    var x = Graphics.pageToCanvasX(TouchInput.x);
                    var y = Graphics.pageToCanvasY(TouchInput.y);
                    var sw = this._statusWindow;
                    if (x >= sw.x && x < sw.x + sw.width && y >= sw.y && y < sw.y + sw.height) {
                        SoundManager.playCursor();
                        this.nextActor();
                        TouchInput.clear();
                    }
                }
            };
        }

        // [Scene_Skill]
        if (typeof Scene_Skill !== 'undefined' && Scene_Skill.prototype) {
            var _Scene_Skill_createItemWindow = Scene_Skill.prototype.createItemWindow;
            Scene_Skill.prototype.createItemWindow = function() {
                if (_Scene_Skill_createItemWindow) _Scene_Skill_createItemWindow.call(this);
                if (this._itemWindow) {
                    this._itemWindow.setHandler('pagedown', this.nextActor.bind(this));
                    this._itemWindow.setHandler('pageup',   this.previousActor.bind(this));
                }
            };

            var _Scene_Skill_onActorChange = Scene_Skill.prototype.onActorChange;
            Scene_Skill.prototype.onActorChange = function() {
                var wasItemActive = this._itemWindow && this._itemWindow.active;
                if (_Scene_Skill_onActorChange) _Scene_Skill_onActorChange.call(this);
                if (wasItemActive && this._itemWindow) {
                    if (this._skillTypeWindow) this._skillTypeWindow.deactivate();
                    this._itemWindow.activate();
                    this._itemWindow.select(0);
                }
            };

            var _Scene_Skill_update = Scene_Skill.prototype.update;
            Scene_Skill.prototype.update = function() {
                if (_Scene_Skill_update) {
                    _Scene_Skill_update.call(this);
                } else if (Scene_ItemBase.prototype.update) {
                    Scene_ItemBase.prototype.update.call(this);
                }
                if (TouchInput.isTriggered() && this._statusWindow && this.isActive()) {
                    var x = Graphics.pageToCanvasX(TouchInput.x);
                    var y = Graphics.pageToCanvasY(TouchInput.y);
                    var sw = this._statusWindow;
                    if (x >= sw.x && x < sw.x + sw.width && y >= sw.y && y < sw.y + sw.height) {
                        SoundManager.playCursor();
                        this.nextActor();
                        TouchInput.clear();
                    }
                }
            };
        }

        // [Scene_Status]
        if (typeof Scene_Status !== 'undefined' && Scene_Status.prototype) {
            var _Scene_Status_update = Scene_Status.prototype.update;
            Scene_Status.prototype.update = function() {
                if (_Scene_Status_update) {
                    _Scene_Status_update.call(this);
                } else if (Scene_MenuBase.prototype.update) {
                    Scene_MenuBase.prototype.update.call(this);
                }
                if (TouchInput.isTriggered() && this._statusWindow && this.isActive()) {
                    var x = Graphics.pageToCanvasX(TouchInput.x);
                    if (x < Graphics.boxWidth / 2) {
                        SoundManager.playCursor();
                        this.previousActor();
                    } else {
                        SoundManager.playCursor();
                        this.nextActor();
                    }
                    TouchInput.clear();
                }
            };
        }

        // [Window_EroStatus / H Status Plugin]
        if (typeof Window_EroStatus !== 'undefined' && Window_EroStatus.prototype && Window_EroStatus.prototype.update) {
            var _Window_EroStatus_update = Window_EroStatus.prototype.update;
            Window_EroStatus.prototype.update = function() {
                if (typeof CBR_eroStatusState !== 'undefined' && CBR_eroStatusState && CBR_eroStatusState.num && 1 < CBR_eroStatusState.num.length && this.isOpenAndActive()) {
                    if (Input.isTriggered('pagedown')) {
                        SoundManager.playCursor(2);
                        CBR_eroStatusState.now = ((CBR_eroStatusState.now + 1) < CBR_eroStatusState.num.length) ? CBR_eroStatusState.now + 1 : 0;
                        this._CBR_complete = false;
                    } else if (Input.isTriggered('pageup')) {
                        SoundManager.playCursor(2);
                        CBR_eroStatusState.now = ((CBR_eroStatusState.now) < 1) ? CBR_eroStatusState.num.length - 1 : CBR_eroStatusState.now - 1;
                        this._CBR_complete = false;
                    }
                }
                return _Window_EroStatus_update.apply(this, arguments);
            };
        }
    } catch (e) {
        console.error("Menu character switch init error:", e);
    }

    // =========================================================================
    // 3. TƯƠNG TÁC CHẠM & CHUỘT CHO MENU TRANH TÙY BIẾN (CUSTOM PICTURE MENU)
    // =========================================================================

    var customMenuButtons = [
        { id: 31, base: "menu_button_01_item",   sel: "menu_button_01_item_sel" },
        { id: 32, base: "menu_button_02_skill",  sel: "menu_button_02_skill_sel" },
        { id: 33, base: "menu_button_03_equip",  sel: "menu_button_03_equip_sel" },
        { id: 34, base: "menu_button_04_status", sel: "menu_button_04_status_sel" },
        { id: 36, base: "menu_button_05_ero",    sel: "menu_button_05_ero_sel" },
        { id: 37, base: "menu_button_06_option", sel: "menu_button_06_option_sel" },
        { id: 38, base: "menu_button_07_save",   sel: "menu_button_07_save_sel" },
        { id: 39, base: "menu_button_08_end",    sel: "menu_button_08_end_sel" }
    ];

    function updateCustomMenuPictures(selectedIndex) {
        if (!$gameScreen) return;
        for (var i = 0; i < customMenuButtons.length; i++) {
            var b = customMenuButtons[i];
            var name = (i + 1 === selectedIndex) ? b.sel : b.base;
            $gameScreen.showPicture(b.id, name, 0, 0, 0, 100, 100, 255, 0);
        }
    }

    function getCustomMenuButtonIndex(x, y) {
        if (x < 0 || x > 245) return 0;
        if (y >= 105 && y < 168) return 1;
        if (y >= 168 && y < 230) return 2;
        if (y >= 230 && y < 294) return 3;
        if (y >= 294 && y < 356) return 4;
        if (y >= 356 && y < 420) return 5;
        if (y >= 420 && y < 482) return 6;
        if (y >= 482 && y < 546) return 7;
        if (y >= 546 && y <= 615) return 8;
        return 0;
    }

    try {
        if (typeof Scene_Map !== 'undefined' && Scene_Map.prototype) {
            var _Scene_Map_isMapTouchOk = Scene_Map.prototype.isMapTouchOk;
            Scene_Map.prototype.isMapTouchOk = function() {
                if ($gameSwitches && $gameSwitches.value(82)) {
                    return false;
                }
                return _Scene_Map_isMapTouchOk ? _Scene_Map_isMapTouchOk.call(this) : true;
            };

            var _Game_Player_canMove = Game_Player.prototype.canMove;
            Game_Player.prototype.canMove = function() {
                if ($gameSwitches && $gameSwitches.value(82)) {
                    return false;
                }
                return _Game_Player_canMove ? _Game_Player_canMove.call(this) : true;
            };

            var _Scene_Map_update = Scene_Map.prototype.update;
            Scene_Map.prototype.update = function() {
                if (_Scene_Map_update) _Scene_Map_update.call(this);
                this.updateCustomMenuInteraction();
            };

            Scene_Map.prototype.updateCustomMenuInteraction = function() {
                if (!$gameSwitches || !$gameSwitches.value(82)) {
                    return;
                }

                var tx = TouchInput.x;
                var ty = TouchInput.y;

                var hovered = getCustomMenuButtonIndex(tx, ty);
                if (hovered > 0 && $gameVariables.value(21) !== hovered) {
                    $gameVariables.setValue(21, hovered);
                    updateCustomMenuPictures(hovered);
                    SoundManager.playCursor();
                }

                if (TouchInput.isTriggered()) {
                    var clicked = getCustomMenuButtonIndex(tx, ty);
                    if (clicked > 0) {
                        $gameVariables.setValue(21, clicked);
                        updateCustomMenuPictures(clicked);
                        SoundManager.playOk();

                        switch (clicked) {
                            case 1:
                                SceneManager.push(Scene_Item);
                                break;
                            case 2:
                                SceneManager.push(Scene_Skill);
                                break;
                            case 3:
                                SceneManager.push(Scene_Equip);
                                break;
                            case 4:
                                SceneManager.push(Scene_Status);
                                break;
                            case 5:
                                SceneManager.push(Scene_EroStatus);
                                break;
                            case 6:
                                SceneManager.push(Scene_Options);
                                break;
                            case 7:
                                SceneManager.push(Scene_Save);
                                $gameTemp.reserveCommonEvent(18);
                                break;
                            case 8:
                                Input._currentState['ok'] = true;
                                setTimeout(function() {
                                    Input._currentState['ok'] = false;
                                }, 60);
                                break;
                        }
                        TouchInput.clear();
                    } else if (tx > 245 || ty < 100 || ty > 615) {
                        SoundManager.playCancel();
                        $gameTemp.reserveCommonEvent(11);
                        TouchInput.clear();
                    }
                }

                if (Input.isTriggered('cancel') || Input.isTriggered('escape') || TouchInput.isCancelled()) {
                    SoundManager.playCancel();
                    $gameTemp.reserveCommonEvent(11);
                }
            };
        }
    } catch (e) {
        console.error("Custom menu interaction error:", e);
    }

    // =========================================================================
    // 4. BÀN PHÍM ẢO CẢM ỨNG: CẦN GẠT JOYSTICK + NÚT CHẠY TOGGLE
    // =========================================================================

    function isMobilePlatform() {
        // Chỉ ẩn trên bản NW.js (Game.exe) của Windows máy tính
        if (typeof Utils !== 'undefined' && Utils.isNwjs && Utils.isNwjs()) {
            return false;
        }
        return true;
    }

    function createVirtualPad() {
        if (!isMobilePlatform()) return;
        if (document.getElementById("mv-virtual-pad-container")) return;

        var container = document.createElement("div");
        container.id = "mv-virtual-pad-container";
        container.style.cssText = [
            "position: fixed",
            "top: 0",
            "left: 0",
            "width: 100vw",
            "height: 100vh",
            "pointer-events: none",
            "z-index: 99999",
            "user-select: none",
            "-webkit-user-select: none",
            "font-family: sans-serif",
            "touch-action: none"
        ].join(";");

        var style = document.createElement("style");
        style.innerHTML = `
            .vpad-btn {
                position: absolute;
                pointer-events: auto;
                background: rgba(30, 30, 45, 0.65);
                color: #ffffff;
                border: 2px solid rgba(255, 255, 255, 0.45);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 17px;
                font-weight: bold;
                text-shadow: 0 1px 3px rgba(0,0,0,0.8);
                box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                touch-action: none;
                cursor: pointer;
                transition: transform 0.05s, background 0.05s;
                -webkit-tap-highlight-color: transparent;
            }
            .vpad-btn:active, .vpad-btn.pressed {
                background: rgba(255, 215, 0, 0.85) !important;
                color: #111 !important;
                border-color: #fff !important;
                transform: scale(0.92);
            }
            .vpad-shoulder-btn {
                position: absolute;
                pointer-events: auto;
                background: rgba(40, 50, 75, 0.75);
                color: #ffffff;
                border: 2px solid rgba(255, 255, 255, 0.55);
                border-radius: 21px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 15px;
                font-weight: bold;
                text-shadow: 0 1px 3px rgba(0,0,0,0.8);
                box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                touch-action: none;
                cursor: pointer;
                transition: transform 0.05s, background 0.05s;
                -webkit-tap-highlight-color: transparent;
                width: 68px;
                height: 42px;
            }
            .vpad-shoulder-btn:active, .vpad-shoulder-btn.pressed {
                background: rgba(255, 215, 0, 0.85) !important;
                color: #111 !important;
                border-color: #fff !important;
                transform: scale(0.92);
            }
            .vpad-btn-q {
                bottom: 185px;
                bottom: max(185px, calc(env(safe-area-inset-bottom, 25px) + 160px));
                left: 25px;
                left: max(25px, env(safe-area-inset-left, 25px));
            }
            .vpad-btn-e {
                bottom: 215px;
                bottom: max(215px, calc(env(safe-area-inset-bottom, 25px) + 190px));
                right: 25px;
                right: max(25px, env(safe-area-inset-right, 25px));
            }
            .vpad-joystick-center {
                position: absolute;
                bottom: 25px;
                bottom: max(25px, env(safe-area-inset-bottom, 25px));
                left: 25px;
                left: max(25px, env(safe-area-inset-left, 25px));
                width: 140px;
                height: 140px;
                pointer-events: auto;
                touch-action: none;
            }
            .vpad-joystick-base {
                position: relative;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(45, 50, 75, 0.5) 0%, rgba(18, 22, 35, 0.8) 100%);
                border: 2px solid rgba(255, 255, 255, 0.35);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.55), inset 0 0 10px rgba(255, 255, 255, 0.1);
                box-sizing: border-box;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .vpad-joystick-arrow {
                position: absolute;
                color: rgba(255, 255, 255, 0.35);
                font-size: 13px;
                font-weight: bold;
                pointer-events: none;
            }
            .vpad-arrow-up { top: 6px; }
            .vpad-arrow-down { bottom: 6px; }
            .vpad-arrow-left { left: 8px; }
            .vpad-arrow-right { right: 8px; }
            .vpad-joystick-knob {
                position: absolute;
                top: calc(50% - 28px);
                left: calc(50% - 28px);
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.95), rgba(195, 205, 225, 0.85) 60%, rgba(110, 120, 140, 0.9));
                border: 2px solid rgba(255, 255, 255, 0.9);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.8);
                pointer-events: none;
                transform: translate3d(0, 0, 0);
                transition: transform 0.08s ease-out;
            }
            .vpad-joystick-knob.active {
                background: radial-gradient(circle at 35% 35%, #ffffff, #ffe066 60%, #e6a800 100%);
                border-color: #ffd700;
                box-shadow: 0 0 16px rgba(255, 215, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.6);
                transition: none;
            }
            .vpad-actions-center {
                position: absolute;
                bottom: 25px;
                bottom: max(25px, env(safe-area-inset-bottom, 25px));
                right: 25px;
                right: max(25px, env(safe-area-inset-right, 25px));
                width: 180px;
                height: 180px;
                pointer-events: none;
            }
            .vpad-top-bar {
                position: absolute;
                top: 10px;
                top: max(10px, env(safe-area-inset-top, 10px));
                right: 15px;
                right: max(15px, env(safe-area-inset-right, 15px));
                display: flex;
                gap: 8px;
                align-items: center;
                pointer-events: auto;
                z-index: 100000;
            }
            .vpad-top-btn {
                background: rgba(0, 0, 0, 0.65);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.45);
                border-radius: 16px;
                padding: 6px 12px;
                font-size: 12px;
                font-weight: bold;
                cursor: pointer;
                user-select: none;
                -webkit-user-select: none;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                transition: background 0.15s, border-color 0.15s, transform 0.1s;
                touch-action: manipulation;
                white-space: nowrap;
                -webkit-tap-highlight-color: transparent;
            }
            .vpad-top-btn:active {
                transform: scale(0.95);
            }
            .vpad-btn-edit.edit-active {
                background: rgba(34, 139, 34, 0.95) !important;
                border-color: #ffd700 !important;
                color: #ffffff !important;
                box-shadow: 0 0 12px rgba(255, 215, 0, 0.75);
                animation: vpad-pulse 1.5s infinite;
            }
            .vpad-btn-reset {
                background: rgba(178, 34, 34, 0.8) !important;
                border-color: rgba(255, 255, 255, 0.5) !important;
            }
            @keyframes vpad-pulse {
                0% { box-shadow: 0 0 6px rgba(255, 215, 0, 0.4); }
                50% { box-shadow: 0 0 16px rgba(255, 215, 0, 0.9); }
                100% { box-shadow: 0 0 6px rgba(255, 215, 0, 0.4); }
            }
            .vpad-edit-toast {
                position: absolute;
                top: 50px;
                top: max(50px, calc(env(safe-area-inset-top, 10px) + 40px));
                left: 50%;
                transform: translateX(-50%);
                background: rgba(15, 18, 30, 0.92);
                color: #ffd700;
                border: 1.5px solid rgba(255, 215, 0, 0.7);
                border-radius: 12px;
                padding: 7px 18px;
                font-size: 13px;
                font-weight: bold;
                pointer-events: none;
                z-index: 100001;
                box-shadow: 0 4px 15px rgba(0,0,0,0.65);
                display: none;
                text-align: center;
                white-space: nowrap;
            }
            .vpad-draggable-editing {
                outline: 2px dashed #ffd700 !important;
                outline-offset: 4px;
                background-color: rgba(255, 215, 0, 0.12) !important;
                border-radius: 18px;
                cursor: move !important;
            }
        `;
        document.head.appendChild(style);

        // Joystick
        var joystickContainer = document.createElement("div");
        joystickContainer.className = "vpad-joystick-center";

        var joystickBase = document.createElement("div");
        joystickBase.className = "vpad-joystick-base";

        var arrowUp = document.createElement("div");
        arrowUp.className = "vpad-joystick-arrow vpad-arrow-up";
        arrowUp.innerText = "▲";
        var arrowDown = document.createElement("div");
        arrowDown.className = "vpad-joystick-arrow vpad-arrow-down";
        arrowDown.innerText = "▼";
        var arrowLeft = document.createElement("div");
        arrowLeft.className = "vpad-joystick-arrow vpad-arrow-left";
        arrowLeft.innerText = "◄";
        var arrowRight = document.createElement("div");
        arrowRight.className = "vpad-joystick-arrow vpad-arrow-right";
        arrowRight.innerText = "►";

        var joystickKnob = document.createElement("div");
        joystickKnob.className = "vpad-joystick-knob";

        joystickBase.appendChild(arrowUp);
        joystickBase.appendChild(arrowDown);
        joystickBase.appendChild(arrowLeft);
        joystickBase.appendChild(arrowRight);
        joystickBase.appendChild(joystickKnob);
        joystickContainer.appendChild(joystickBase);
        container.appendChild(joystickContainer);

        var activeTouchId = null;
        var isMouseDown = false;

        function updateJoystick(clientX, clientY) {
            var rect = joystickBase.getBoundingClientRect();
            var centerX = rect.left + rect.width / 2;
            var centerY = rect.top + rect.height / 2;
            var dx = clientX - centerX;
            var dy = clientY - centerY;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var maxDist = 45;

            if (dist > maxDist) {
                dx = (dx / dist) * maxDist;
                dy = (dy / dist) * maxDist;
            }

            joystickKnob.style.transform = "translate3d(" + dx + "px, " + dy + "px, 0)";

            var deadZone = 10;
            if (dist < deadZone) {
                Input._currentState['right'] = false;
                Input._currentState['left']  = false;
                Input._currentState['down']  = false;
                Input._currentState['up']    = false;
                if (arrowUp) arrowUp.style.color = "rgba(255, 255, 255, 0.4)";
                if (arrowDown) arrowDown.style.color = "rgba(255, 255, 255, 0.4)";
                if (arrowLeft) arrowLeft.style.color = "rgba(255, 255, 255, 0.4)";
                if (arrowRight) arrowRight.style.color = "rgba(255, 255, 255, 0.4)";
            } else {
                // Chia chính xác 4 hướng thành 4 phần riêng biệt (90 độ mỗi phần, tuyệt đối không kết hợp)
                var absX = Math.abs(dx);
                var absY = Math.abs(dy);

                if (absX >= absY) {
                    var isRight = dx > 0;
                    Input._currentState['right'] = isRight;
                    Input._currentState['left']  = !isRight;
                    Input._currentState['up']    = false;
                    Input._currentState['down']  = false;

                    if (arrowRight) arrowRight.style.color = isRight ? "#ffd700" : "rgba(255, 255, 255, 0.4)";
                    if (arrowLeft)  arrowLeft.style.color  = !isRight ? "#ffd700" : "rgba(255, 255, 255, 0.4)";
                    if (arrowUp)    arrowUp.style.color    = "rgba(255, 255, 255, 0.4)";
                    if (arrowDown)  arrowDown.style.color  = "rgba(255, 255, 255, 0.4)";
                } else {
                    var isDown = dy > 0;
                    Input._currentState['down']  = isDown;
                    Input._currentState['up']    = !isDown;
                    Input._currentState['right'] = false;
                    Input._currentState['left']  = false;

                    if (arrowDown)  arrowDown.style.color  = isDown ? "#ffd700" : "rgba(255, 255, 255, 0.4)";
                    if (arrowUp)    arrowUp.style.color    = !isDown ? "#ffd700" : "rgba(255, 255, 255, 0.4)";
                    if (arrowRight) arrowRight.style.color = "rgba(255, 255, 255, 0.4)";
                    if (arrowLeft)  arrowLeft.style.color  = "rgba(255, 255, 255, 0.4)";
                }
            }
        }

        function resetJoystick() {
            activeTouchId = null;
            isMouseDown = false;
            joystickKnob.classList.remove("active");
            joystickKnob.style.transform = "translate3d(0, 0, 0)";
            Input._currentState['right'] = false;
            Input._currentState['left']  = false;
            Input._currentState['down']  = false;
            Input._currentState['up']    = false;
            if (arrowUp) arrowUp.style.color = "rgba(255, 255, 255, 0.4)";
            if (arrowDown) arrowDown.style.color = "rgba(255, 255, 255, 0.4)";
            if (arrowLeft) arrowLeft.style.color = "rgba(255, 255, 255, 0.4)";
            if (arrowRight) arrowRight.style.color = "rgba(255, 255, 255, 0.4)";
        }

        // Tương tác Joystick thuần túy trên container (không can thiệp vào window của iOS)
        joystickContainer.addEventListener("touchstart", function(e) {
            if (isEditMode) return;
            if (e && e.cancelable) e.preventDefault();
            if (e && e.stopPropagation) e.stopPropagation();
            if (activeTouchId === null && e.changedTouches && e.changedTouches.length > 0) {
                var touch = e.changedTouches[0];
                activeTouchId = touch.identifier;
                joystickKnob.classList.add("active");
                updateJoystick(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        joystickContainer.addEventListener("touchmove", function(e) {
            if (e && e.cancelable) e.preventDefault();
            if (activeTouchId !== null && e.changedTouches) {
                for (var i = 0; i < e.changedTouches.length; i++) {
                    var touch = e.changedTouches[i];
                    if (touch.identifier === activeTouchId) {
                        updateJoystick(touch.clientX, touch.clientY);
                        break;
                    }
                }
            }
        }, { passive: false });

        joystickContainer.addEventListener("touchend", function(e) {
            if (activeTouchId !== null && e.changedTouches) {
                for (var i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === activeTouchId) {
                        resetJoystick();
                        break;
                    }
                }
            }
        }, { passive: false });

        joystickContainer.addEventListener("touchcancel", function(e) {
            resetJoystick();
        }, { passive: false });

        joystickContainer.addEventListener("mousedown", function(e) {
            if (isEditMode) return;
            if (e && e.cancelable) e.preventDefault();
            isMouseDown = true;
            joystickKnob.classList.add("active");
            updateJoystick(e.clientX, e.clientY);
        });

        joystickContainer.addEventListener("mousemove", function(e) {
            if (isMouseDown) {
                updateJoystick(e.clientX, e.clientY);
            }
        });

        joystickContainer.addEventListener("mouseup", function(e) {
            if (isMouseDown) {
                resetJoystick();
            }
        });

        joystickContainer.addEventListener("mouseleave", function(e) {
            if (isMouseDown) {
                resetJoystick();
            }
        });

        // Action buttons
        var actionContainer = document.createElement("div");
        actionContainer.className = "vpad-actions-center";

        var actionButtons = [
            { key: "ok", label: "OK", right: 0, top: 55, size: 60, bg: "rgba(34, 139, 34, 0.75)" },
            { key: "escape", label: "HỦY", right: 65, top: 115, size: 54, bg: "rgba(178, 34, 34, 0.75)" },
            { key: "menu", label: "MENU", right: 65, top: 0, size: 50, bg: "rgba(70, 130, 180, 0.75)" }
        ];

        actionButtons.forEach(function(b) {
            var btn = document.createElement("div");
            btn.className = "vpad-btn";
            btn.style.width = b.size + "px";
            btn.style.height = b.size + "px";
            btn.style.right = b.right + "px";
            btn.style.top = b.top + "px";
            if (b.bg) btn.style.background = b.bg;
            btn.innerText = b.label;
            bindKeyEvents(btn, b.key);
            actionContainer.appendChild(btn);
        });

        // Dash Toggle
        var dashBtn = document.createElement("div");
        dashBtn.className = "vpad-btn vpad-dash-toggle";
        dashBtn.style.width = "52px";
        dashBtn.style.height = "52px";
        dashBtn.style.right = "125px";
        dashBtn.style.top = "58px";
        dashBtn.style.fontSize = "13px";

        function updateDashUI() {
            if (isDashActive) {
                dashBtn.innerText = "🏃 BẬT";
                dashBtn.style.background = "rgba(255, 140, 0, 0.95)";
                dashBtn.style.borderColor = "#ffd700";
                dashBtn.style.boxShadow = "0 0 14px rgba(255, 165, 0, 0.9), 0 4px 10px rgba(0,0,0,0.5)";
                dashBtn.style.color = "#ffffff";
            } else {
                dashBtn.innerText = "CHẠY";
                dashBtn.style.background = "rgba(106, 90, 205, 0.75)";
                dashBtn.style.borderColor = "rgba(255, 255, 255, 0.45)";
                dashBtn.style.boxShadow = "0 4px 10px rgba(0,0,0,0.5)";
                dashBtn.style.color = "#ffffff";
            }
        }
        updateDashUI();

        function toggleDash(e) {
            if (isEditMode) return;
            if (e && e.cancelable) {
                e.preventDefault();
            }
            if (e && e.stopPropagation) {
                e.stopPropagation();
            }
            isDashActive = !isDashActive;
            Input._currentState['shift'] = isDashActive;
            updateDashUI();
            SoundManager.playCursor();
        }

        dashBtn.addEventListener("touchstart", toggleDash, { passive: false });
        dashBtn.addEventListener("mousedown", toggleDash);
        actionContainer.appendChild(dashBtn);

        container.appendChild(actionContainer);

        // Q & E buttons
        var btnQ = document.createElement("div");
        btnQ.className = "vpad-shoulder-btn vpad-btn-q";
        btnQ.innerText = "◀ Q";
        bindKeyEvents(btnQ, "pageup");
        container.appendChild(btnQ);

        var btnE = document.createElement("div");
        btnE.className = "vpad-shoulder-btn vpad-btn-e";
        btnE.innerText = "E ▶";
        bindKeyEvents(btnE, "pagedown");
        container.appendChild(btnE);

        // =====================================================================
        // TÍNH NĂNG TÙY CHỈNH VỊ TRÍ PHÍM ẢO (DRAG & DROP)
        // =====================================================================
        var draggedItem = null;
        var dragOffset = { x: 0, y: 0 };
        var toastTimer = null;
        var STORAGE_KEY = 'memelis_vpad_custom_positions';

        var toastEl = document.createElement("div");
        toastEl.className = "vpad-edit-toast";
        container.appendChild(toastEl);

        function showToast(text, duration) {
            toastEl.innerText = text;
            toastEl.style.display = "block";
            if (toastTimer) clearTimeout(toastTimer);
            if (duration) {
                toastTimer = setTimeout(function() {
                    toastEl.style.display = "none";
                }, duration);
            }
        }

        function savePositions() {
            var positions = {
                joystick: { left: joystickContainer.style.left, top: joystickContainer.style.top },
                actions:  { left: actionContainer.style.left,   top: actionContainer.style.top },
                btnQ:     { left: btnQ.style.left,              top: btnQ.style.top },
                btnE:     { left: btnE.style.left,              top: btnE.style.top }
            };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
            } catch(e) {}
        }

        function loadPositions() {
            try {
                var raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return;
                var p = JSON.parse(raw);
                if (p.joystick && p.joystick.left) {
                    joystickContainer.style.left = p.joystick.left;
                    joystickContainer.style.top = p.joystick.top;
                    joystickContainer.style.bottom = "auto";
                    joystickContainer.style.right = "auto";
                }
                if (p.actions && p.actions.left) {
                    actionContainer.style.left = p.actions.left;
                    actionContainer.style.top = p.actions.top;
                    actionContainer.style.bottom = "auto";
                    actionContainer.style.right = "auto";
                }
                if (p.btnQ && p.btnQ.left) {
                    btnQ.style.left = p.btnQ.left;
                    btnQ.style.top = p.btnQ.top;
                    btnQ.style.bottom = "auto";
                    btnQ.style.right = "auto";
                }
                if (p.btnE && p.btnE.left) {
                    btnE.style.left = p.btnE.left;
                    btnE.style.top = p.btnE.top;
                    btnE.style.bottom = "auto";
                    btnE.style.right = "auto";
                }
            } catch(e) {}
        }

        function resetPositions() {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch(e) {}
            [joystickContainer, actionContainer, btnQ, btnE].forEach(function(el) {
                el.style.left = "";
                el.style.top = "";
                el.style.right = "";
                el.style.bottom = "";
            });
        }

        function makeDraggable(element) {
            function onDragStart(clientX, clientY, e) {
                if (!isEditMode) return;
                if (e && e.cancelable) e.preventDefault();
                if (e && e.stopPropagation) e.stopPropagation();

                draggedItem = element;
                var rect = element.getBoundingClientRect();
                dragOffset.x = clientX - rect.left;
                dragOffset.y = clientY - rect.top;
            }

            element.addEventListener("touchstart", function(e) {
                if (isEditMode && e.touches && e.touches.length > 0) {
                    onDragStart(e.touches[0].clientX, e.touches[0].clientY, e);
                }
            }, { passive: false });

            element.addEventListener("mousedown", function(e) {
                if (isEditMode) {
                    onDragStart(e.clientX, e.clientY, e);
                }
            });
        }

        function onDragMove(clientX, clientY, e) {
            if (!isEditMode || !draggedItem) return;
            if (e && e.cancelable) e.preventDefault();

            var newLeft = clientX - dragOffset.x;
            var newTop = clientY - dragOffset.y;

            var w = draggedItem.offsetWidth || 60;
            var h = draggedItem.offsetHeight || 60;
            var maxW = window.innerWidth;
            var maxH = window.innerHeight;

            if (newLeft < 0) newLeft = 0;
            if (newTop < 0) newTop = 0;
            if (newLeft + w > maxW) newLeft = maxW - w;
            if (newTop + h > maxH) newTop = maxH - h;

            draggedItem.style.left = newLeft + "px";
            draggedItem.style.top = newTop + "px";
            draggedItem.style.right = "auto";
            draggedItem.style.bottom = "auto";
        }

        function onDragEnd() {
            if (!isEditMode || !draggedItem) return;
            draggedItem = null;
        }

        window.addEventListener("touchmove", function(e) {
            if (isEditMode && draggedItem && e.touches && e.touches.length > 0) {
                onDragMove(e.touches[0].clientX, e.touches[0].clientY, e);
            }
        }, { passive: false });

        window.addEventListener("touchend", onDragEnd, { passive: false });
        window.addEventListener("touchcancel", onDragEnd, { passive: false });

        window.addEventListener("mousemove", function(e) {
            if (isEditMode && draggedItem) {
                onDragMove(e.clientX, e.clientY, e);
            }
        });
        window.addEventListener("mouseup", onDragEnd);

        makeDraggable(joystickContainer);
        makeDraggable(actionContainer);
        makeDraggable(btnQ);
        makeDraggable(btnE);

        // Thanh điều khiển trên cùng (Nút chỉnh vị trí + Nút bật/tắt phím ảo)
        var topBar = document.createElement("div");
        topBar.className = "vpad-top-bar";

        var resetBtn = document.createElement("div");
        resetBtn.className = "vpad-top-btn vpad-btn-reset";
        resetBtn.innerText = "🔄 Mặc định";
        resetBtn.style.display = "none";

        var editBtn = document.createElement("div");
        editBtn.className = "vpad-top-btn vpad-btn-edit";
        editBtn.innerText = "⚙️ Chỉnh vị trí";

        var toggleBtn = document.createElement("div");
        toggleBtn.className = "vpad-top-btn vpad-btn-toggle";
        toggleBtn.innerText = "🎮 Phím Ảo: Bật";

        editBtn.onclick = function() {
            isEditMode = !isEditMode;
            if (isEditMode) {
                editBtn.innerText = "💾 Lưu vị trí";
                editBtn.classList.add("edit-active");
                resetBtn.style.display = "inline-block";
                actionContainer.style.pointerEvents = "auto";

                [joystickContainer, actionContainer, btnQ, btnE].forEach(function(el) {
                    el.classList.add("vpad-draggable-editing");
                });

                showToast("👉 Kéo thả các cụm phím đến vị trí mong muốn, rồi bấm [💾 Lưu vị trí]");
                SoundManager.playCursor();
            } else {
                savePositions();
                editBtn.innerText = "⚙️ Chỉnh vị trí";
                editBtn.classList.remove("edit-active");
                resetBtn.style.display = "none";
                actionContainer.style.pointerEvents = "none";

                [joystickContainer, actionContainer, btnQ, btnE].forEach(function(el) {
                    el.classList.remove("vpad-draggable-editing");
                });

                showToast("✅ Đã lưu vị trí phím thành công!", 2000);
                SoundManager.playOk();
            }
        };

        resetBtn.onclick = function() {
            resetPositions();
            showToast("🔄 Đã khôi phục vị trí mặc định!", 2000);
            SoundManager.playCancel();
        };

        toggleBtn.onclick = function() {
            if (isEditMode) {
                editBtn.click();
            }
            isPadVisible = !isPadVisible;
            joystickContainer.style.display = isPadVisible ? "block" : "none";
            actionContainer.style.display = isPadVisible ? "block" : "none";
            btnQ.style.display = isPadVisible ? "flex" : "none";
            btnE.style.display = isPadVisible ? "flex" : "none";
            editBtn.style.display = isPadVisible ? "inline-block" : "none";
            if (!isPadVisible) resetBtn.style.display = "none";
            toggleBtn.innerText = isPadVisible ? "🎮 Phím Ảo: Bật" : "🎮 Phím Ảo: Tắt";
            toggleBtn.style.opacity = isPadVisible ? "1" : "0.5";
        };

        topBar.appendChild(resetBtn);
        topBar.appendChild(editBtn);
        topBar.appendChild(toggleBtn);
        container.appendChild(topBar);

        loadPositions();

        document.body.appendChild(container);
    }

    function bindKeyEvents(element, keyName) {
        var isDown = false;

        function press(e) {
            if (isEditMode) return;
            if (e && e.cancelable) {
                e.preventDefault();
            }
            if (e && e.stopPropagation) {
                e.stopPropagation();
            }
            if (isDown) return;
            isDown = true;
            element.classList.add("pressed");
            Input._currentState[keyName] = true;
        }

        function release(e) {
            if (isEditMode) return;
            if (e && e.cancelable) {
                e.preventDefault();
            }
            if (e && e.stopPropagation) {
                e.stopPropagation();
            }
            if (!isDown) return;
            isDown = false;
            element.classList.remove("pressed");
            setTimeout(function() {
                if (!isDown) {
                    Input._currentState[keyName] = false;
                }
            }, 60);
        }

        element.addEventListener("touchstart", press, { passive: false });
        element.addEventListener("touchend", release, { passive: false });
        element.addEventListener("touchcancel", release, { passive: false });

        element.addEventListener("mousedown", press);
        element.addEventListener("mouseup", release);
        element.addEventListener("mouseleave", release);
    }

    try {
        if (typeof Scene_Base !== 'undefined' && Scene_Base.prototype) {
            var _Scene_Base_start = Scene_Base.prototype.start;
            Scene_Base.prototype.start = function() {
                if (_Scene_Base_start) _Scene_Base_start.call(this);
                try {
                    createVirtualPad();
                } catch(err) {
                    console.error("createVirtualPad error:", err);
                }
            };
        }
    } catch(e) {
        console.error("Scene_Base.prototype.start hook error:", e);
    }

    // =========================================================================
    // 5. HỆ THỐNG TỰ ĐỘNG LƯU (AUTO-SAVE) & BẢO VỆ CHỐNG GAME OVER / MẤT DỮ LIỆU
    // =========================================================================

    var _lastAutoSaveTime = 0;
    var _autoSaveCooldown = 5000; // Tối thiểu 5 giây giữa các lần tự động lưu
    var _autoSaveSlot = 1;        // Slot 1 được chỉ định làm slot Tự Động Lưu (Auto-Save)
    var _autoSaveToastEl = null;
    var _autoSaveToastTimer = null;

    // Toast thông báo Tự động lưu thanh lịch, không cản trở thao tác chạm
    function showAutoSaveNotification(text) {
        try {
            if (!_autoSaveToastEl) {
                _autoSaveToastEl = document.createElement("div");
                _autoSaveToastEl.style.position = "fixed";
                _autoSaveToastEl.style.top = "10px";
                _autoSaveToastEl.style.left = "50%";
                _autoSaveToastEl.style.transform = "translateX(-50%)";
                _autoSaveToastEl.style.backgroundColor = "rgba(18, 18, 32, 0.92)";
                _autoSaveToastEl.style.color = "#ffd700";
                _autoSaveToastEl.style.border = "1.5px solid rgba(255, 215, 0, 0.75)";
                _autoSaveToastEl.style.borderRadius = "20px";
                _autoSaveToastEl.style.padding = "6px 18px";
                _autoSaveToastEl.style.fontSize = "13px";
                _autoSaveToastEl.style.fontFamily = "sans-serif";
                _autoSaveToastEl.style.fontWeight = "bold";
                _autoSaveToastEl.style.boxShadow = "0 4px 16px rgba(0,0,0,0.6)";
                _autoSaveToastEl.style.zIndex = "999999";
                _autoSaveToastEl.style.pointerEvents = "none";
                _autoSaveToastEl.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                _autoSaveToastEl.style.display = "none";
                document.body.appendChild(_autoSaveToastEl);
            }
            _autoSaveToastEl.innerText = text || "💾 Đã tự động lưu";
            _autoSaveToastEl.style.display = "block";
            _autoSaveToastEl.style.opacity = "1";
            _autoSaveToastEl.style.transform = "translateX(-50%) translateY(0)";
            if (_autoSaveToastTimer) clearTimeout(_autoSaveToastTimer);
            _autoSaveToastTimer = setTimeout(function() {
                if (_autoSaveToastEl) {
                    _autoSaveToastEl.style.opacity = "0";
                    _autoSaveToastEl.style.transform = "translateX(-50%) translateY(-6px)";
                    setTimeout(function() {
                        if (_autoSaveToastEl) _autoSaveToastEl.style.display = "none";
                    }, 300);
                }
            }, 1500);
        } catch(e) {}
    }

    function performAutoSave(reason, force) {
        try {
            if (!window.$gameParty || !window.$gameMap || !window.$gameSystem) {
                return false;
            }
            var now = Date.now();
            if (!force && (now - _lastAutoSaveTime < _autoSaveCooldown)) {
                return false;
            }
            if (typeof BattleManager !== 'undefined' && BattleManager.isBattleTest && BattleManager.isBattleTest()) {
                return false;
            }
            // Không lưu khi đang trong chuỗi hội thoại / tin nhắn để tránh lỗi trạng thái
            if (window.$gameMessage && $gameMessage.isBusy()) {
                return false;
            }
            // Không lưu khi cả đội đang chết chưa kịp hồi sinh
            if (window.$gameParty && $gameParty.isAllDead()) {
                return false;
            }

            $gameParty.refresh();
            $gameSystem.onBeforeSave();

            var success = DataManager.saveGame(_autoSaveSlot);
            if (success) {
                _lastAutoSaveTime = now;
                try {
                    StorageManager.cleanBackup(_autoSaveSlot);
                } catch(e) {}
                console.log("[AutoSave] Đã tự động lưu thành công vào Slot " + _autoSaveSlot + " (" + (reason || "Tự động") + ")");
                showAutoSaveNotification("💾 Đã tự động lưu");
                return true;
            }
        } catch(err) {
            console.warn("[AutoSave] Lỗi tự động lưu:", err);
        }
        return false;
    }

    // 1. Tự động lưu khi chuyển bản đồ / vào phòng / lên tầng mới
    try {
        if (typeof Scene_Map !== 'undefined' && Scene_Map.prototype) {
            var _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
            Scene_Map.prototype.onMapLoaded = function() {
                if (_Scene_Map_onMapLoaded) _Scene_Map_onMapLoaded.apply(this, arguments);
                setTimeout(function() {
                    performAutoSave("Vào bản đồ mới");
                }, 500);
            };

            // Tự động lưu định kỳ mỗi 60s khi người chơi di chuyển thám hiểm
            var _Scene_Map_updateAutoSave = Scene_Map.prototype.update;
            Scene_Map.prototype.update = function() {
                if (_Scene_Map_updateAutoSave) _Scene_Map_updateAutoSave.call(this);
                if (Date.now() - _lastAutoSaveTime > 60000) {
                    if (window.$gamePlayer && $gamePlayer.canMove && $gamePlayer.canMove() &&
                        window.$gameMap && !$gameMap.isEventRunning() &&
                        window.$gameMessage && !$gameMessage.isBusy()) {
                        performAutoSave("Định kỳ thám hiểm");
                    }
                }
            };
        }
    } catch(e) {
        console.error("Scene_Map auto-save hook error:", e);
    }

    // 2. Tự động lưu sau trận đấu & Bảo vệ khi bị hạ gục (Common Event 16: Hồi sinh & Trở về nhà)
    try {
        if (typeof BattleManager !== 'undefined') {
            var _BattleManager_updateBattleEnd = BattleManager.updateBattleEnd;
            BattleManager.updateBattleEnd = function() {
                if (!this.isBattleTest() && window.$gameParty && $gameParty.isAllDead()) {
                    if (this._canLose) {
                        $gameParty.reviveBattleMembers();
                        SceneManager.pop();
                    } else {
                        // KÍCH HOẠT CƠ CHẾ CỦA GAME (Common Event 16: 全滅時帰還)
                        // Fades out -> Switch 64 ON -> Hồi máu -> Về nhà an toàn, KHÔNG BỊ GAME OVER MẤT FILE!
                        $gameScreen.startFadeOut(10);
                        $gameSwitches.setValue(64, true);
                        $gameParty.reviveBattleMembers();
                        SceneManager.pop();
                        setTimeout(function() {
                            performAutoSave("Hồi sinh an toàn", true);
                        }, 800);
                    }
                    this._phase = null;
                    return;
                }

                if (_BattleManager_updateBattleEnd) {
                    _BattleManager_updateBattleEnd.apply(this, arguments);
                }

                if (!this.isBattleTest() && window.$gameParty && !$gameParty.isAllDead()) {
                    setTimeout(function() {
                        performAutoSave("Sau chiến thắng");
                    }, 400);
                }
            };
        }
    } catch(e) {
        console.error("BattleManager auto-save & rescue hook error:", e);
    }

    // 3. Chặn Game Over trên bản đồ (bẫy/độc) -> Kích hoạt hồi sinh an toàn
    try {
        if (typeof Scene_Base !== 'undefined' && Scene_Base.prototype) {
            Scene_Base.prototype.checkGameover = function() {
                if (window.$gameParty && $gameParty.isAllDead()) {
                    $gameScreen.startFadeOut(10);
                    $gameSwitches.setValue(64, true);
                    $gameParty.reviveBattleMembers();
                }
            };
        }

        if (typeof Scene_Gameover !== 'undefined' && Scene_Gameover.prototype) {
            Scene_Gameover.prototype.gotoTitle = function() {
                $gameSwitches.setValue(64, true);
                $gameParty.reviveBattleMembers();
                SceneManager.goto(Scene_Map);
            };
        }
    } catch(e) {
        console.error("Scene_Base checkGameover hook error:", e);
    }

    // 4. Hiển thị nhãn [Tự Động Lưu] màu vàng cho Slot 1 trong danh sách Lưu/Tải game
    try {
        if (typeof Window_SavefileList !== 'undefined' && Window_SavefileList.prototype) {
            var _Window_SavefileList_drawFileId = Window_SavefileList.prototype.drawFileId;
            Window_SavefileList.prototype.drawFileId = function(id, x, y) {
                if (id === _autoSaveSlot) {
                    this.changeTextColor('#ffcc00');
                    var label = (typeof TextManager !== 'undefined' && TextManager.file ? TextManager.file : "Tệp") + ' ' + id + ' [Tự Động Lưu]';
                    this.drawText(label, x, y, 250);
                    this.resetTextColor();
                } else {
                    if (_Window_SavefileList_drawFileId) {
                        _Window_SavefileList_drawFileId.call(this, id, x, y);
                    } else {
                        var normalLabel = (typeof TextManager !== 'undefined' && TextManager.file ? TextManager.file : "Tệp") + ' ' + id;
                        this.drawText(normalLabel, x, y, 180);
                    }
                }
            };
        }
    } catch(e) {
        console.error("Window_SavefileList hook error:", e);
    }

    // 5. Bảo vệ WebGL Context Loss (chống sập màn hình đen khi điện thoại tải nặng)
    try {
        if (typeof Graphics !== 'undefined') {
            var attachContextGuards = function(canvas) {
                if (canvas && !canvas._contextGuarded) {
                    canvas._contextGuarded = true;
                    canvas.addEventListener('webglcontextlost', function(e) {
                        if (e && e.preventDefault) e.preventDefault();
                        console.warn("[WebGL] Context lost - prevented default termination");
                    }, false);
                    canvas.addEventListener('webglcontextrestored', function(e) {
                        console.log("[WebGL] Context successfully restored");
                    }, false);
                }
            };
            if (Graphics._canvas) attachContextGuards(Graphics._canvas);
            var _Graphics_createRenderer = Graphics._createRenderer;
            Graphics._createRenderer = function() {
                if (_Graphics_createRenderer) _Graphics_createRenderer.apply(this, arguments);
                if (Graphics._canvas) attachContextGuards(Graphics._canvas);
            };
        }
    } catch(e) {
        console.error("WebGL context guard error:", e);
    }

    // 6. Tự động lưu khi người chơi tắt màn hình, chuyển app hoặc thoát game
    try {
        var onAppSuspended = function() {
            performAutoSave("Chuyển app / Tắt máy", true);
        };
        document.addEventListener("visibilitychange", function() {
            if (document.hidden) onAppSuspended();
        });
        window.addEventListener("pagehide", onAppSuspended);
        window.addEventListener("beforeunload", onAppSuspended);
        document.addEventListener("pause", onAppSuspended);
    } catch(e) {
        console.error("App lifecycle auto-save listener error:", e);
    }

})();
