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
 * 3. Bàn phím ảo trên màn hình (Virtual Gamepad):
 *    - Cụm điều hướng (Lên, Xuống, Trái, Phải).
 *    - Cụm phím hành động (OK / Chọn, HỦY / Quay lại, MENU, CHẠY).
 *    - Nút bật / tắt bàn phím ảo ở góc trên màn hình.
 */

(function() {
    "use strict";

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

    // 1 chạm là Chọn và Xác Nhận ngay lập tức cho mọi menu
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
    // 2. TẠO BÀN PHÍM ẢO CẢM ỨNG TRÊN MÀN HÌNH (VIRTUAL TOUCH CONTROLLER)
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
                background: rgba(255, 215, 0, 0.8) !important;
                color: #111 !important;
                border-color: #fff !important;
                transform: scale(0.92);
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

        // Tạo từng nút D-Pad (Up, Down, Left, Right)
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

        // Nút ẩn / hiện phím ảo
        var toggleBtn = document.createElement("div");
        toggleBtn.className = "vpad-toggle";
        toggleBtn.innerText = "🎮 Phím Ảo: Bật";
        var isPadVisible = true;
        toggleBtn.onclick = function() {
            isPadVisible = !isPadVisible;
            dpadContainer.style.display = isPadVisible ? "block" : "none";
            actionContainer.style.display = isPadVisible ? "block" : "none";
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