//=============================================================================
// MobileControlsAndTouchFix.js
//=============================================================================
/*:
 * @plugindesc Bàn phím ảo cảm ứng và tối ưu tương tác chạm 1 chạm cho điện thoại (Android & iOS).
 * @author Assistant
 *
 * @help
 * Plugin này giải quyết toàn diện tương tác trên điện thoại di động:
 * 1. Tương tác chạm 1 chạm (1-Tap): Chạm trực tiếp vào bất kỳ mục menu nào sẽ lập tức chọn và xác nhận (không cần gõ đúp 2 lần).
 * 2. Căn chỉnh toạ độ chạm chuẩn xác: Khắc phục lệch toạ độ do màn hình dài (tai thỏ / viền đen) bằng getBoundingClientRect.
 * 3. Hỗ trợ cảm ứng & chuột cho Menu tranh tùy biến (Custom Picture Menu):
 *    - Chạm/Click trực tiếp vào 8 nút (Item, Skill, Equips, Status, H Status, Settings, Save, Close).
 *    - Hiệu ứng đổi hình sáng khi chọn/hover.
 *    - Chạm ra ngoài menu hoặc nút HỦY để đóng menu ngay lập tức.
 * 4. Chuyển đổi nhân vật tiện lợi trong Equips / Skill / Status / H Status:
 *    - Thêm 2 phím ảo [◀ Q] và [E ▶] ngay trên màn hình để chuyển qua lại nhân vật.
 *    - Phím vật lý: Hỗ trợ phím Q (PageUp) và E/W (PageDown) trên bàn phím.
 *    - Chạm trực tiếp vào khung chân dung/thông số nhân vật để đổi nhân vật ngay lập tức.
 *    - Cho phép đổi nhân vật ngay cả khi đang duyệt danh sách slot trang bị hoặc danh sách kỹ năng.
 * 5. Bàn phím ảo trên màn hình (Virtual Gamepad):
 *    - Cụm điều hướng (Lên, Xuống, Trái, Phải).
 *    - Cụm phím hành động (OK / Chọn, HỦY / Quay lại, MENU, CHẠY, ◀ Q, E ▶).
 *    - Nút bật / tắt bàn phím ảo ở góc trên màn hình.
 */

(function() {
    "use strict";

    var isPadVisible = true;

    // Gán phím vật lý E (69) và Q (81) vào hệ thống PageDown / PageUp của RPG Maker
    Input.keyMapper[69] = 'pagedown'; // Phím E = Đổi nhân vật kế tiếp (Next Actor)
    Input.keyMapper[81] = 'pageup';   // Phím Q = Đổi nhân vật trước (Previous Actor)
    Input.keyMapper[87] = 'pagedown'; // Phím W = Đổi nhân vật kế tiếp

    // =========================================================================
    // 1. SỬA TOẠ ĐỘ CHẠM & TƯƠNG TÁC CHẠM 1 CHẠM (1-TAP SELECTION)
    // =========================================================================

    // Sửa toạ độ pixel-perfect bất chấp tỉ lệ màn hình điện thoại
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

    // 1 chạm là Chọn và Xác Nhận ngay lập tức cho mọi menu cửa sổ (Window_Selectable)
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

    // =========================================================================
    // 2. HỖ TRỢ CHUYỂN ĐỔI NHÂN VẬT TIỆN LỢI TRONG MENU (EQUIP, SKILL, STATUS, H STATUS)
    // =========================================================================

    // [Scene_Equip]
    // Cho phép bấm Q/E đổi nhân vật ngay cả khi đang ở cửa sổ Slot và Item
    var _Scene_Equip_createSlotWindow = Scene_Equip.prototype.createSlotWindow;
    Scene_Equip.prototype.createSlotWindow = function() {
        _Scene_Equip_createSlotWindow.call(this);
        this._slotWindow.setHandler('pagedown', this.nextActor.bind(this));
        this._slotWindow.setHandler('pageup',   this.previousActor.bind(this));
    };

    var _Scene_Equip_createItemWindow = Scene_Equip.prototype.createItemWindow;
    Scene_Equip.prototype.createItemWindow = function() {
        _Scene_Equip_createItemWindow.call(this);
        this._itemWindow.setHandler('pagedown', this.nextActor.bind(this));
        this._itemWindow.setHandler('pageup',   this.previousActor.bind(this));
    };

    var _Scene_Equip_onActorChange = Scene_Equip.prototype.onActorChange;
    Scene_Equip.prototype.onActorChange = function() {
        var wasSlotActive = this._slotWindow && this._slotWindow.active;
        var slotIndex = this._slotWindow ? this._slotWindow.index() : 0;
        _Scene_Equip_onActorChange.call(this);
        if (wasSlotActive && this._slotWindow) {
            this._commandWindow.deactivate();
            this._slotWindow.activate();
            this._slotWindow.select(slotIndex);
        }
    };

    // Chạm trực tiếp vào khung Status/Face nhân vật bên trái để đổi nhân vật
    var _Scene_Equip_update = Scene_Equip.prototype.update;
    Scene_Equip.prototype.update = function() {
        _Scene_Equip_update.call(this);
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

    // [Scene_Skill]
    var _Scene_Skill_createItemWindow = Scene_Skill.prototype.createItemWindow;
    Scene_Skill.prototype.createItemWindow = function() {
        _Scene_Skill_createItemWindow.call(this);
        this._itemWindow.setHandler('pagedown', this.nextActor.bind(this));
        this._itemWindow.setHandler('pageup',   this.previousActor.bind(this));
    };

    var _Scene_Skill_onActorChange = Scene_Skill.prototype.onActorChange;
    Scene_Skill.prototype.onActorChange = function() {
        var wasItemActive = this._itemWindow && this._itemWindow.active;
        _Scene_Skill_onActorChange.call(this);
        if (wasItemActive && this._itemWindow) {
            this._skillTypeWindow.deactivate();
            this._itemWindow.activate();
            this._itemWindow.select(0);
        }
    };

    var _Scene_Skill_update = Scene_Skill.prototype.update;
    Scene_Skill.prototype.update = function() {
        _Scene_Skill_update.call(this);
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

    // [Scene_Status]
    var _Scene_Status_update = Scene_Status.prototype.update;
    Scene_Status.prototype.update = function() {
        _Scene_Status_update.call(this);
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

    // [Window_EroStatus / H Status Plugin]
    if (typeof Window_EroStatus !== 'undefined') {
        var _Window_EroStatus_update = Window_EroStatus.prototype.update;
        Window_EroStatus.prototype.update = function() {
            if (typeof CBR_eroStatusState !== 'undefined' && 1 < CBR_eroStatusState.num.length && this.isOpenAndActive()) {
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
            _Window_EroStatus_update.call(this);
        };
    }

    // =========================================================================
    // 3. TƯƠNG TÁC CHẠM & CHUỘT CHO MENU TRANH TÙY BIẾN (CUSTOM PICTURE MENU)
    // =========================================================================

    // Danh sách 8 nút trong Menu tranh tùy biến của game
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
        // Cột các nút menu nằm từ x = 0 đến x = 245
        if (x < 0 || x > 245) return 0;
        // Từng nút theo trục Y (dựa trên bounding box thực tế của các ảnh nút)
        if (y >= 105 && y < 168) return 1; // Item
        if (y >= 168 && y < 230) return 2; // Skill
        if (y >= 230 && y < 294) return 3; // Equips
        if (y >= 294 && y < 356) return 4; // Status
        if (y >= 356 && y < 420) return 5; // H Status
        if (y >= 420 && y < 482) return 6; // Settings (Options)
        if (y >= 482 && y < 546) return 7; // Save
        if (y >= 546 && y <= 615) return 8; // Close / End
        return 0;
    }

    // Chặn nhân vật di chuyển trên bản đồ khi menu tranh đang mở
    var _Scene_Map_isMapTouchOk = Scene_Map.prototype.isMapTouchOk;
    Scene_Map.prototype.isMapTouchOk = function() {
        if ($gameSwitches && $gameSwitches.value(82)) {
            return false;
        }
        return _Scene_Map_isMapTouchOk.call(this);
    };

    var _Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if ($gameSwitches && $gameSwitches.value(82)) {
            return false;
        }
        return _Game_Player_canMove.call(this);
    };

    // Bắt tương tác chuột và cảm ứng cho menu tùy biến
    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        this.updateCustomMenuInteraction();
    };

    Scene_Map.prototype.updateCustomMenuInteraction = function() {
        if (!$gameSwitches || !$gameSwitches.value(82)) {
            // Khi menu đã đóng, khôi phục lại cụm D-pad và nút Q nếu trước đó đang bật
            var dpad = document.querySelector(".vpad-dpad-center");
            if (dpad && dpad.dataset.menuHidden === "true") {
                if (isPadVisible) dpad.style.display = "block";
                dpad.dataset.menuHidden = "false";
            }
            var btnQ = document.querySelector(".vpad-btn-q");
            if (btnQ && btnQ.dataset.menuHidden === "true") {
                if (isPadVisible) btnQ.style.display = "flex";
                btnQ.dataset.menuHidden = "false";
            }
            return;
        }

        // Tạm ẩn cụm D-pad và nút Q khi mở menu để không che nút Save và Close ở góc trái dưới
        var dpadEl = document.querySelector(".vpad-dpad-center");
        if (dpadEl && dpadEl.style.display !== "none") {
            dpadEl.style.display = "none";
            dpadEl.dataset.menuHidden = "true";
        }
        var btnQEl = document.querySelector(".vpad-btn-q");
        if (btnQEl && btnQEl.style.display !== "none") {
            btnQEl.style.display = "none";
            btnQEl.dataset.menuHidden = "true";
        }

        var tx = TouchInput.x;
        var ty = TouchInput.y;

        // 1. Hover chuột (trên PC): rê chuột tới đâu sáng nút đó
        var hovered = getCustomMenuButtonIndex(tx, ty);
        if (hovered > 0 && $gameVariables.value(21) !== hovered) {
            $gameVariables.setValue(21, hovered);
            updateCustomMenuPictures(hovered);
            SoundManager.playCursor();
        }

        // 2. Chạm màn hình hoặc click chuột trái
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
                        // Kích hoạt xác nhận Về màn hình chính / Hủy
                        Input._currentState['ok'] = true;
                        setTimeout(function() {
                            Input._currentState['ok'] = false;
                        }, 60);
                        break;
                }
                TouchInput.clear();
            } else if (tx > 245 || ty < 100 || ty > 615) {
                // Chạm vào bất kỳ vị trí nào bên ngoài cột nút menu -> Đóng menu
                SoundManager.playCancel();
                $gameTemp.reserveCommonEvent(11);
                TouchInput.clear();
            }
        }

        // 3. Phím HỦY / Quay lại (ESC, phím HỦY trên bàn phím ảo, hoặc chuột phải)
        if (Input.isTriggered('cancel') || Input.isTriggered('escape') || TouchInput.isCancelled()) {
            SoundManager.playCancel();
            $gameTemp.reserveCommonEvent(11);
        }
    };

    // =========================================================================
    // 4. TẠO BÀN PHÍM ẢO CẢM ỨNG TRÊN MÀN HÌNH (VIRTUAL TOUCH CONTROLLER)
    // =========================================================================

    function createVirtualPad() {
        if (document.getElementById("mv-virtual-pad-container")) return;

        // Container
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

        // CSS Styles
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
                font-size: 18px;
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
                bottom: 205px;
                bottom: max(205px, calc(env(safe-area-inset-bottom, 25px) + 180px));
                left: 25px;
                left: max(25px, env(safe-area-inset-left, 25px));
            }
            .vpad-btn-e {
                bottom: 215px;
                bottom: max(215px, calc(env(safe-area-inset-bottom, 25px) + 190px));
                right: 25px;
                right: max(25px, env(safe-area-inset-right, 25px));
            }
            .vpad-dpad-center {
                position: absolute;
                bottom: 25px;
                bottom: max(25px, env(safe-area-inset-bottom, 25px));
                left: 25px;
                left: max(25px, env(safe-area-inset-left, 25px));
                width: 170px;
                height: 170px;
                pointer-events: none;
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
            .vpad-toggle {
                position: absolute;
                top: 10px;
                top: max(10px, env(safe-area-inset-top, 10px));
                right: 15px;
                right: max(15px, env(safe-area-inset-right, 15px));
                pointer-events: auto;
                background: rgba(0, 0, 0, 0.55);
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.4);
                border-radius: 16px;
                padding: 6px 14px;
                font-size: 13px;
                font-weight: bold;
                cursor: pointer;
                z-index: 100000;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            }
        `;
        document.head.appendChild(style);

        // Cụm D-Pad bên trái
        var dpadContainer = document.createElement("div");
        dpadContainer.className = "vpad-dpad-center";

        var dpadButtons = [
            { key: "up", label: "▲", left: 58, top: 0, size: 54 },
            { key: "down", label: "▼", left: 58, top: 114, size: 54 },
            { key: "left", label: "◄", left: 0, top: 58, size: 54 },
            { key: "right", label: "►", left: 114, top: 58, size: 54 }
        ];

        dpadButtons.forEach(function(b) {
            var btn = document.createElement("div");
            btn.className = "vpad-btn";
            btn.style.width = b.size + "px";
            btn.style.height = b.size + "px";
            btn.style.left = b.left + "px";
            btn.style.top = b.top + "px";
            btn.innerText = b.label;
            bindKeyEvents(btn, b.key);
            dpadContainer.appendChild(btn);
        });
        container.appendChild(dpadContainer);

        // Cụm Nút Hành Động bên phải
        var actionContainer = document.createElement("div");
        actionContainer.className = "vpad-actions-center";

        var actionButtons = [
            // Nút OK / Chọn (A)
            { key: "ok", label: "OK", right: 0, top: 55, size: 60, bg: "rgba(34, 139, 34, 0.75)" },
            // Nút Hủy / Back (B)
            { key: "escape", label: "HỦY", right: 65, top: 115, size: 54, bg: "rgba(178, 34, 34, 0.75)" },
            // Nút Menu
            { key: "menu", label: "MENU", right: 65, top: 0, size: 50, bg: "rgba(70, 130, 180, 0.75)" },
            // Nút Chạy / Dash (Shift)
            { key: "shift", label: "CHẠY", right: 125, top: 60, size: 48, bg: "rgba(106, 90, 205, 0.75)" }
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
        container.appendChild(actionContainer);

        // Nút [◀ Q] (Đổi nhân vật trước / PageUp) - Nằm phía trên D-Pad
        var btnQ = document.createElement("div");
        btnQ.className = "vpad-shoulder-btn vpad-btn-q";
        btnQ.innerText = "◀ Q";
        bindKeyEvents(btnQ, "pageup");
        container.appendChild(btnQ);

        // Nút [E ▶] (Đổi nhân vật sau / PageDown) - Nằm phía trên cụm Action
        var btnE = document.createElement("div");
        btnE.className = "vpad-shoulder-btn vpad-btn-e";
        btnE.innerText = "E ▶";
        bindKeyEvents(btnE, "pagedown");
        container.appendChild(btnE);

        // Nút ẩn / hiện phím ảo
        var toggleBtn = document.createElement("div");
        toggleBtn.className = "vpad-toggle";
        toggleBtn.innerText = "🎮 Phím Ảo: Bật";
        toggleBtn.onclick = function() {
            isPadVisible = !isPadVisible;
            dpadContainer.style.display = isPadVisible ? "block" : "none";
            actionContainer.style.display = isPadVisible ? "block" : "none";
            btnQ.style.display = isPadVisible ? "flex" : "none";
            btnE.style.display = isPadVisible ? "flex" : "none";
            toggleBtn.innerText = isPadVisible ? "🎮 Phím Ảo: Bật" : "🎮 Phím Ảo: Tắt";
            toggleBtn.style.opacity = isPadVisible ? "1" : "0.5";
        };
        container.appendChild(toggleBtn);

        document.body.appendChild(container);
    }

    // Gắn sự kiện cảm ứng và chuột vào hệ thống Input của game
    function bindKeyEvents(element, keyName) {
        var isDown = false;

        function press(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (isDown) return;
            isDown = true;
            element.classList.add("pressed");
            Input._currentState[keyName] = true;
        }

        function release(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (!isDown) return;
            isDown = false;
            element.classList.remove("pressed");
            // Giữ tối thiểu 60ms để Input.update() chắc chắn bắt được nút trong frame kế tiếp
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

    // Tự động khởi tạo bàn phím ảo ngay khi scene đầu tiên sẵn sàng
    var _Scene_Base_start = Scene_Base.prototype.start;
    Scene_Base.prototype.start = function() {
        _Scene_Base_start.call(this);
        createVirtualPad();
    };

})();
