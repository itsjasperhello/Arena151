// Hosts the game in a full-screen web view and provides the same native features as the Android app
// (listing bundled sprites / music / cries, saving a file, vibration) under the name the game already uses.
import UIKit
import WebKit

final class GameViewController: UIViewController, WKUIDelegate, WKNavigationDelegate {
    private var webView: WKWebView!
    private let wwwFolder = Bundle.main.resourceURL!.appendingPathComponent("www", isDirectory: true)

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .all }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }

    override func loadView() {
        let root = UIView()
        root.backgroundColor = .black
        view = root

        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(BundleSchemeHandler(root: wwwFolder), forURLScheme: "arena151")
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let content = WKUserContentController()
        content.add(WeakMessageHandler(self), name: "native")
        content.addUserScript(WKUserScript(source: bridgeScript(), injectionTime: .atDocumentStart, forMainFrameOnly: true))
        config.userContentController = content

        webView = WKWebView(frame: .zero, configuration: config)
        webView.uiDelegate = self
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.backgroundColor = .black
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        if #available(iOS 16.4, *) { webView.isInspectable = true }   // debuggable from Safari on a Mac
        webView.translatesAutoresizingMaskIntoConstraints = false
        root.addSubview(webView)

        // Keep the game clear of the notch / Dynamic Island and the home indicator.
        let safe = root.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: safe.trailingAnchor),
            webView.topAnchor.constraint(equalTo: safe.topAnchor),
            webView.bottomAnchor.constraint(equalTo: safe.bottomAnchor)
        ])
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        webView.load(URLRequest(url: URL(string: "arena151://app/index.html")!))
    }

    /// Lists the bundled files once at start-up and exposes them (plus save / vibrate) as window.AndroidApp,
    /// the same interface the Android app provides, so the game needs no iPhone-specific code.
    private func bridgeScript() -> String {
        func list(_ folder: String) -> [String] {
            let dir = wwwFolder.appendingPathComponent(folder, isDirectory: true)
            return ((try? FileManager.default.contentsOfDirectory(atPath: dir.path)) ?? []).sorted()
        }
        let lists: [String: [String]] = ["sprites": list("sprites"), "music": list("music"), "cry": list("cry")]
        let json = (try? JSONSerialization.data(withJSONObject: lists)).flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
        return """
        (function () {
          var lists = \(json);
          var post = function (msg) { try { window.webkit.messageHandlers.native.postMessage(msg); } catch (e) {} };
          window.AndroidApp = {
            listSprites: function () { return JSON.stringify(lists.sprites || []); },
            listAssets: function (dir) { return JSON.stringify(lists[String(dir)] || []); },
            vibrate: function (ms) { post({ t: 'vibrate', ms: Number(ms) || 20 }); },
            saveFile: function (name, text) { post({ t: 'save', name: String(name), text: String(text) }); return 'Files: ' + name; },
            isApp: function () { return true; }
          };
          window.IOSApp = true;
        })();
        """
    }

    fileprivate func handle(_ message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let type = body["t"] as? String else { return }
        switch type {
        case "vibrate":
            let ms = (body["ms"] as? NSNumber)?.intValue ?? 20
            let generator = UIImpactFeedbackGenerator(style: ms >= 60 ? .heavy : (ms >= 30 ? .medium : .light))
            generator.impactOccurred()
        case "save":
            let name = ((body["name"] as? String) ?? "arena151-save.json").replacingOccurrences(of: "/", with: "-")
            let text = (body["text"] as? String) ?? ""
            let file = FileManager.default.temporaryDirectory.appendingPathComponent(name)
            do {
                try text.write(to: file, atomically: true, encoding: .utf8)
                let share = UIActivityViewController(activityItems: [file], applicationActivities: nil)
                share.popoverPresentationController?.sourceView = view               // required on iPad
                share.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
                present(share, animated: true)
            } catch {
                showAlert("Could not save the file: \(error.localizedDescription)")
            }
        default:
            break
        }
    }

    // MARK: alert() / confirm() from the game (e.g. "Leave the tournament?")

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        present(alert, animated: true)
    }

    // Reload the game if iOS ever discards the web page in the background (it shows a blank screen otherwise).
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }

    private func showAlert(_ text: String) {
        let alert = UIAlertController(title: nil, message: text, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

/// Avoids a retain cycle between the web view's content controller and the view controller.
private final class WeakMessageHandler: NSObject, WKScriptMessageHandler {
    private weak var target: GameViewController?
    init(_ target: GameViewController) { self.target = target }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.handle(message)
    }
}
