var fso = new ActiveXObject("Scripting.FileSystemObject");
var lzFile = fso.OpenTextFile("..\\js\\libs\\lz-string.js", 1);
var lzCode = lzFile.ReadAll();
lzFile.Close();
eval(lzCode);

var args = WScript.Arguments;
var inJson = args.length > 0 ? args(0) : "file1_readable.json";
var outSave = args.length > 1 ? args(1) : "file1.rpgsave";

if (!fso.FileExists(inJson)) {
    WScript.Echo("Khong tim thay file: " + inJson);
    WScript.Quit(1);
}

var jf = fso.OpenTextFile(inJson, 1, false, -1); // unicode
var jsonContent = jf.ReadAll();
jf.Close();

// Parse and minify JSON
var obj = eval("(" + jsonContent + ")");
var minified = JSON ? JSON.stringify(obj) : jsonContent;

var compressed = LZString.compressToBase64(minified);
var sf = fso.CreateTextFile(outSave, true);
sf.Write(compressed);
sf.Close();
WScript.Echo("Da ma hoa thanh cong " + inJson + " -> " + outSave);
