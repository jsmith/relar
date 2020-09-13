import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonLoading,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { ellipse, square, triangle } from 'ionicons/icons';
import {Tabs} from './pages/Tabs';
import { Search } from './pages/Search';
import {Library} from './pages/Library';
import './tailwind.css';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
// import '@ionic/react/css/padding.css';
// import '@ionic/react/css/float-elements.css';
// import '@ionic/react/css/text-alignment.css';
// import '@ionic/react/css/text-transformation.css';
// import '@ionic/react/css/flex-utils.css';
// import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import { Settings } from './pages/Settings';
import { useUser } from './shared/web/auth'

const PrivateRoutes = () => {
  return (
    <IonReactRouter>
      <IonRouterOutlet>
        {/****** AUTH CREATE ACCOUNT */}
        <Route path="/login" component={() => <div>LOGIN</div>} exact={true} />
        <Route path="/register" component={() => <div>REGISTER</div>} exact={true} />
        <Route path="/" render={() => <Redirect to="/login" />} />
      </IonRouterOutlet>
    </IonReactRouter>
  );
};
const PublicRoutes = () => {
  return (
    <IonReactRouter>
      <Route path="/tabs" component={Tabs} />
      <Route path="/" render={() => <Redirect to="/tabs/home" />} />
    </IonReactRouter>
  );
};

const App = () => {
  // const { store } = React.useContext(MobXProviderContext);
  const { loading, user } = useUser();

  return loading ? (
    <IonApp>
      <IonLoading isOpen={true} message="Starting App..." />
    </IonApp>
  ) : (
    <IonApp>{user ? <PrivateRoutes /> : <PublicRoutes />}</IonApp>
  );
};

// const App: React.FC = () => (
//   <IonApp>
//     <IonReactRouter>
//       {/* TODO */}
//       {/* https://forum.ionicframework.com/t/ionic-react-how-can-i-hide-the-iontabs-im-so-desperate-please-help-asappp/188119/2 */}
//       {/* <IonTabs> */}
//         <IonRouterOutlet>
//           <Route path="/home" component={Home} exact={true} />
//           <Route path="/search" component={Search} exact={true} />
//           <Route path="/library" component={Library} exact={true} />
//           <Route path="/settings" component={Settings} exact={true} />
//           {/* <Route path="/" render={() => <Redirect to="/home" />} /> */}
//         </IonRouterOutlet>
//         <IonTabBar slot="bottom">
//           <IonTabButton tab="home" href="/home">
//             <IonIcon icon={triangle} />
//             <IonLabel>Home</IonLabel>
//           </IonTabButton>
//           <IonTabButton tab="search" href="/search">
//             <IonIcon icon={ellipse} />
//             <IonLabel>Search</IonLabel>
//           </IonTabButton>
//           <IonTabButton tab="library" href="/library">
//             <IonIcon icon={square} />
//             <IonLabel>Library</IonLabel>
//           </IonTabButton>
//         </IonTabBar>
//       {/* </IonTabs> */}
//     </IonReactRouter>
//   </IonApp>
// );

export default App;
