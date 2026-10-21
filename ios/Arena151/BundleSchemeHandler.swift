// Serves the game's files (index.html, sprites/, music/, cry/) from inside the app at arena151://app/…
// Same-origin loading lets the game read sprite files directly, and byte-range support lets iOS play the MP3s.
import Foundation
import WebKit
import UniformTypeIdentifiers

final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    private let root: URL

    init(root: URL) {
        self.root = root.standardizedFileURL
    }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else {
            task.didFailWithError(URLError(.badURL))
            return
        }
        var path = url.path                         // already percent-decoded, e.g. "/sprites/mr-mime (1).gif"
        if path.isEmpty || path == "/" { path = "/index.html" }
        let file = root.appendingPathComponent(String(path.dropFirst())).standardizedFileURL

        // Never serve anything outside the game folder.
        guard file.path.hasPrefix(root.path),
              let data = try? Data(contentsOf: file, options: .mappedIfSafe) else {
            let notFound = HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1",
                                           headerFields: ["Content-Type": "text/plain", "Content-Length": "0"])!
            task.didReceive(notFound)
            task.didReceive(Data())
            task.didFinish()
            return
        }

        var status = 200
        var body = data
        var headers: [String: String] = [
            "Content-Type": BundleSchemeHandler.mimeType(for: file.pathExtension),
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache"
        ]
        if let rangeHeader = task.request.value(forHTTPHeaderField: "Range"),
           let range = BundleSchemeHandler.byteRange(rangeHeader, length: data.count) {
            let start = range.start, end = range.end
            body = data.subdata(in: start..<(end + 1))
            status = 206
            headers["Content-Range"] = "bytes \(start)-\(end)/\(data.count)"
        }
        headers["Content-Length"] = String(body.count)

        let response = HTTPURLResponse(url: url, statusCode: status, httpVersion: "HTTP/1.1", headerFields: headers)!
        task.didReceive(response)
        task.didReceive(body)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {
        // Every response is delivered synchronously in start(), so there is nothing to cancel.
    }

    /// Parses "bytes=START-END", "bytes=START-" and "bytes=-SUFFIX".
    static func byteRange(_ header: String, length: Int) -> (start: Int, end: Int)? {
        guard length > 0, header.hasPrefix("bytes=") else { return nil }
        let spec = header.dropFirst("bytes=".count).split(separator: ",").first.map(String.init) ?? ""
        let parts = spec.split(separator: "-", omittingEmptySubsequences: false).map(String.init)
        guard parts.count == 2 else { return nil }
        let start: Int
        var end: Int
        if parts[0].isEmpty {
            guard let suffix = Int(parts[1]), suffix > 0 else { return nil }
            start = max(0, length - suffix)
            end = length - 1
        } else {
            guard let s = Int(parts[0]) else { return nil }
            start = s
            end = parts[1].isEmpty ? length - 1 : (Int(parts[1]) ?? length - 1)
        }
        end = min(end, length - 1)
        guard start >= 0, start <= end else { return nil }
        return (start: start, end: end)
    }

    static func mimeType(for ext: String) -> String {
        switch ext.lowercased() {
        case "html", "htm": return "text/html; charset=utf-8"
        case "js": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json"
        case "txt": return "text/plain; charset=utf-8"
        case "gif": return "image/gif"
        case "png", "apng": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "webp": return "image/webp"
        case "svg": return "image/svg+xml"
        case "mp3": return "audio/mpeg"
        case "wav": return "audio/wav"
        case "ogg": return "audio/ogg"
        case "m4a": return "audio/mp4"
        case "woff2": return "font/woff2"
        case "woff": return "font/woff"
        case "ttf": return "font/ttf"
        default:
            if let type = UTType(filenameExtension: ext), let mime = type.preferredMIMEType { return mime }
            return "application/octet-stream"
        }
    }
}
