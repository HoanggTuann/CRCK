// =============================================================================
// VietnameseLocalization.js for Cute.Broke.and.Dungeon.Bound (ssed)
// Bản dịch Tiếng Việt toàn diện cho game
// =============================================================================
/*:
 * @plugindesc Vietnamese Localization Plugin: Dịch giao diện, lời thoại, phông chữ Tiếng Việt chuẩn Unicode.
 * @author Assistant
 */
(() => {
    "use strict";

    // 1. Phông chữ hỗ trợ Tiếng Việt có dấu đầy đủ (Segoe UI / Arial fallback)
    const _Window_Base_standardFontFace = Window_Base.prototype.standardFontFace;
    Window_Base.prototype.standardFontFace = function() {
        return 'GameFont, "Segoe UI", Tahoma, Arial, sans-serif';
    };

    const _Bitmap_initialize = Bitmap.prototype.initialize;
    Bitmap.prototype.initialize = function(width, height) {
        _Bitmap_initialize.apply(this, arguments);
        this.fontFace = 'GameFont, "Segoe UI", Tahoma, Arial, sans-serif';
    };

    const _Bitmap__makeFontNameText = Bitmap.prototype._makeFontNameText;
    Bitmap.prototype._makeFontNameText = function() {
        if (this.fontFace && !this.fontFace.includes(',')) {
            this.fontFace = this.fontFace + ', "Segoe UI", Tahoma, Arial, sans-serif';
        }
        return _Bitmap__makeFontNameText.apply(this, arguments);
    };

    // 2. Từ điển dịch thuật Tiếng Việt tích hợp sẵn
    const BuiltinDictionary = {
        // Lệnh menu & hệ thống
        "Sure": "Đồng ý",
        "Escape": "Bỏ chạy",
        "Attack": "Tấn công",
        "Defend": "Phòng thủ",
        "Item": "Vật phẩm",
        "Skills": "Kỹ năng",
        "Skill": "Kỹ năng",
        "Equips": "Trang bị",
        "Equip": "Trang bị",
        "Status": "Chỉ số",
        "Team": "Đội hình",
        "Formation": "Đội hình",
        "Save": "Lưu game",
        "End": "Thoát game",
        "Game End": "Thoát game",
        "Settings": "Cài đặt",
        "Options": "Cài đặt",
        "Weapon": "Vũ khí",
        "Armor": "Giáp",
        "Key Items": "Đồ nhiệm vụ",
        "Key Item": "Đồ nhiệm vụ",
        "Best": "Tối ưu",
        "Optimize": "Tối ưu",
        "All Off": "Tháo hết",
        "Clear": "Tháo hết",
        "Start game": "Bắt đầu mới",
        "New Game": "Bắt đầu mới",
        "Continue": "Tiếp tục",
        "Return to Title": "Về màn hình chính",
        "To Title": "Về màn hình chính",
        "Cancel": "Hủy",
        "Buy": "Mua",
        "Sell": "Bán",
        "Fight": "Chiến đấu",
        "Level": "Cấp độ",
        "Lv": "Cấp",
        "Gold": "Vàng",
        "Holding": "Đang giữ",
        "Possession": "Sở hữu",
        "Yes": "Có",
        "No": "Không",
        "No!": "Không đời nào!",
        "Forget it.": "Bỏ qua đi.",
        "Forget it": "Bỏ qua đi",
        "Shop": "Cửa hàng",
        "Work": "Làm việc",
        "Nothing": "Không có gì",
        "Check the Rates": "Xem tỉ lệ",
        "Exchange Items": "Đổi vật phẩm",
        "Help": "Giúp đỡ",
        "Don't help": "Không giúp",
        "Love Egg": "Trứng rung tình yêu",
        "Dildo": "Dương vật giả (Dildo)",
        "Anal Beads": "Chuỗi hạt hậu môn",
        "Futa": "Futanari (Có cu)",
        "Title Illustration 1": "Hình nền 1",
        "Title Illustration 2": "Hình nền 2",
        "True ending": "True Ending",
        "Normal Ending": "Normal Ending",
        "Watch True Ending": "Xem True Ending",
        "Bad Ending (Memelis)": "Bad Ending (Memelis)",
        "Bad Ending (Tina)": "Bad Ending (Tina)",
        "1st Floor Boss": "Trùm tầng 1",
        "2nd Floor Boss": "Trùm tầng 2",
        "3rd Floor Boss": "Trùm tầng 3",
        "4th Floor Boss": "Trùm tầng 4",
        "The Final Boss": "Trùm cuối",
        "Give up": "Bỏ cuộc",
        "Semen": "Tinh dịch",
        "Pee": "Tiểu tiện",
        "Watch Full Event": "Xem toàn bộ sự kiện",
        "Watch CG": "Xem cảnh CG",
        "Swimsuit": "Đồ bơi",
        "Naked": "Khỏa thân",
        "First time": "Lần đầu tiên",
        "Second time": "Lần thứ hai",
        "Thrid Time": "Lần thứ ba",
        "With panties": "Mặc quần lót",
        "No panties": "Không mặc quần lót",
        "Normal Portrait": "Chân dung thường",
        "H Portrait": "Chân dung H",
        "Stocking & Panties": "Tất dài & Quần lót",
        "Only Panties": "Chỉ mặc quần lót",
        "S.D. Illustration": "Tranh Chibi (SD)",
        "Maybe later": "Để sau đi",
        "Save her": "Cứu cô ấy",
        "Don't save her": "Không cứu",
        "Go and have a look": "Đi tới xem thử",
        "Too much trouble": "Phiền phức quá, thôi",
        "refuse": "Từ chối",
        "Approach": "Tiến lại gần",
        "Normal": "Bình thường",
        "Blindfold": "Bịt mắt",
        "Heart Eyes": "Mắt hình trái tim",
        "Talk": "Trò chuyện",
        "Do nothing": "Không làm gì cả",

        // Tin nhắn hệ thống & trạng thái
        "Times": "Lần",
        "Age": "Tuổi",
        "Birthday": "Sinh nhật",
        "Name": "Tên",
        "Lust": "Độ dâm loạn",
        "Masturbated": "Tự sướng",
        "Creampied": "Bắn tinh trong",
        "Throatpied": "Ngậm tinh miệng",
        "Anal Sex": "Quan hệ hậu môn",
        "H Exp": "Số bạn tình",
        "Pregnant": "Mang thai",
        "Give Birth": "Sinh con",
        "Memory Room unlocked!": "Đã mở khóa Phòng Hồi Tưởng!",
        "Return to Banquet Village?": "Quay trở về Làng Yến Tiệc?",
        "Return to Chelunn Village?": "Quay trở về Làng Chelunn?",
        "Would you like to rest today?": "Hôm nay hai bạn có muốn nghỉ ngơi không?",
        "This is Banquet Village": "Đây là Làng Yến Tiệc",
        "Ahead is the memory room!": "Phía trước là Phòng Hồi Tưởng!",
        "Memelis's bed.": "Giường ngủ của Memelis.",
        "When Horny,": "Khi bị Nứng,",
        "you can masturbate if you have Adult Toys set.": "bạn có thể tự sướng nếu có Bộ Đồ Chơi Người Lớn.",
        "Memelis is Horny.": "Memelis đang Cực Kỳ Nứng.",
        "Use Adult Toys set to masturbate?": "Dùng Bộ Đồ Chơi Người Lớn để tự sướng nhé?",
        "Which toy to use?": "Muốn dùng món đồ chơi nào?"
    };

    let ExternalDictionary = {};
    // Đọc từ điển ngoài www/data/Vietnamese_Dictionary.json nếu có
    try {
        if (typeof require !== 'undefined') {
            const fs = require('fs');
            const path = 'www/data/Vietnamese_Dictionary.json';
            if (fs.existsSync(path)) {
                let data = fs.readFileSync(path, 'utf8');
                if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);
                ExternalDictionary = JSON.parse(data);
            }
        }
    } catch (e) {
        console.warn("Could not load external Vietnamese_Dictionary.json:", e);
    }

    function translateText(text) {
        if (!text || typeof text !== 'string') return text;
        const trimmed = text.trim();
        if (ExternalDictionary[trimmed]) return ExternalDictionary[trimmed];
        if (BuiltinDictionary[trimmed]) return BuiltinDictionary[trimmed];
        if (ExternalDictionary[text]) return ExternalDictionary[text];
        if (BuiltinDictionary[text]) return BuiltinDictionary[text];

        // Regex patterns
        // "Obtained X!"
        let m = text.match(/^Obtained (.*)!$/);
        if (m) return `Nhận được ${translateText(m[1])}!`;

        // "X Times"
        m = text.match(/^(\\V\[\d+\]|\d+)\s*Times$/);
        if (m) return `${m[1]} Lần`;

        return text;
    }

    // 3. Hook Game_Message.prototype.add (Lời thoại nhân vật và tin nhắn trong game)
    const _Game_Message_add = Game_Message.prototype.add;
    Game_Message.prototype.add = function(text) {
        _Game_Message_add.call(this, translateText(text));
    };

    // 4. Hook Window_ChoiceList (Lựa chọn tương tác)
    const _Window_ChoiceList_makeCommandList = Window_ChoiceList.prototype.makeCommandList;
    Window_ChoiceList.prototype.makeCommandList = function() {
        const choices = $gameMessage.choices();
        if (choices) {
            for (let i = 0; i < choices.length; i++) {
                choices[i] = translateText(choices[i]);
            }
        }
        _Window_ChoiceList_makeCommandList.apply(this, arguments);
    };

    // 5. Hook Window_Command.prototype.addCommand
    const _Window_Command_addCommand = Window_Command.prototype.addCommand;
    Window_Command.prototype.addCommand = function(name, symbol, enabled, ext) {
        _Window_Command_addCommand.call(this, translateText(name), symbol, enabled, ext);
    };

    // 6. Hook Window_Help.prototype.setText
    const _Window_Help_setText = Window_Help.prototype.setText;
    Window_Help.prototype.setText = function(text) {
        _Window_Help_setText.call(this, translateText(text));
    };

    // 7. Hook Window_Base.prototype.drawText
    const _Window_Base_drawText = Window_Base.prototype.drawText;
    Window_Base.prototype.drawText = function(text, x, y, maxWidth, align) {
        if (typeof text === 'string') {
            text = translateText(text);
        }
        _Window_Base_drawText.call(this, text, x, y, maxWidth, align);
    };

    console.log("VietnameseLocalization plugin activated successfully!");
})();
