// import React from 'react';
// import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, IonLabel } from '@ionic/react';
// import ExploreContainer from '../components/ExploreContainer';

// export const Home = () => {
//   return (
//     <IonPage>
//       <IonItem routerLink="/settings">
//         <IonLabel>User 1</IonLabel>
//       </IonItem>
//       {/* <IonHeader>
//         <IonToolbar>
//           <IonTitle>Tab 1</IonTitle>
//         </IonToolbar>
//       </IonHeader>
//       <IonContent fullscreen>
//         <IonHeader collapse="condense">
//           <IonToolbar>
//             <IonTitle size="large">Tab 1</IonTitle>
//           </IonToolbar>
//         </IonHeader>
//         <ExploreContainer name="Tab 1 page" />
//       </IonContent> */}
//       <div>
//         JACOB TEST
//       </div>
//     </IonPage>
//   );
// };

import { Route, Redirect } from "react-router";
import React from "react";

// import TabOnePage from "../pages/TabOnePage";
// import TabTwoPage from "../pages/TabTwoPage";

import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonRouterOutlet,
} from "@ionic/react";

export const Tabs = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/tabs/home" exact={true}>
          <div>TAB HOME</div>
          {/* <TabOnePage /> */}
        </Route>

        <Route path="/tabs/tab1-detail/:id" exact={true}>
          <div>TAB DETAIL</div>
          {/* <TabOneDetailPage /> */}
        </Route>

        <Route path="/tabs/search" exact={true}>
          <div>SEARCH</div>
          {/* <TabTwoPage /> */}
        </Route>
        <Route path="/tabs" render={() => <Redirect to="/tabs/home" />} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="tab1" href="/tabs/home">
          <IonLabel>Home</IonLabel>
        </IonTabButton>

        <IonTabButton tab="tab2" href="/tabs/search">
          <IonLabel>Search</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};
