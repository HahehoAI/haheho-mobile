import Capacitor

/// The WebView screen, shared by both iOS apps (Haheho AI + Inpatient AI Agent).
///
/// The web config (server URL, base user agent "HahehoApp/x.y") comes from
/// capacitor.config.ts via `npx cap sync` and is the same for every app. The
/// only per-app difference is the Info.plist key `HahehoUserAgentTag` (from the
/// target's build setting HAHEHO_USER_AGENT_TAG), appended after the base user
/// agent so the server can tell the apps apart, e.g.
/// "... HahehoApp/0.1 HahehoInpatient". The "HahehoApp/" marker is always kept:
/// the server detects the native app by it.
class HahehoBridgeViewController: CAPBridgeViewController {
    override func instanceDescriptor() -> InstanceDescriptor {
        let descriptor = super.instanceDescriptor()
        let tag = (Bundle.main.object(forInfoDictionaryKey: "HahehoUserAgentTag") as? String ?? "")
            .trimmingCharacters(in: .whitespaces)
        if !tag.isEmpty {
            let base = descriptor.appendedUserAgentString ?? ""
            descriptor.appendedUserAgentString = base.isEmpty ? tag : "\(base) \(tag)"
        }
        return descriptor
    }
}
