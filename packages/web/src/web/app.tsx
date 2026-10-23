import { Route, Switch } from "wouter";
import Index from "./pages/index";
import Maily from "./pages/Maily";
import Nastaveni from "./pages/Nastaveni";
import Normy from "./pages/Normy";
import Provoz from "./pages/Provoz";
import Rejstrik from "./pages/Rejstrik";
import Revize from "./pages/Revize";
import ZakazkaDetail from "./pages/ZakazkaDetail";
import { Shell } from "./components/layout";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";

function App() {
  return (
    <Provider>
      <Shell>
        <Switch>
          <Route path="/" component={Index} />
          <Route path="/zakazka/:id" component={ZakazkaDetail} />
          <Route path="/rejstrik" component={Rejstrik} />
          <Route path="/revize" component={Revize} />
          <Route path="/normy" component={Normy} />
          <Route path="/maily" component={Maily} />
          <Route path="/provoz" component={Provoz} />
          <Route path="/nastaveni" component={Nastaveni} />
          <Route>
            <div className="py-20 text-center">
              <p className="section-label">Stránka nenalezena</p>
              <p className="mt-4 text-ink-soft">Zkontrolujte adresu, nebo se vraťte na seznam zakázek.</p>
            </div>
          </Route>
        </Switch>
      </Shell>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
