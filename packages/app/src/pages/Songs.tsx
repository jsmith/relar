import React, { useRef } from "react"
import InfiniteScroll from 'react-infinite-scroll-component';

export const Songs = () => {
  const lastVisible = useRef(0);
  const items: Array<{ name: string, artist: string }> = [];

  const next = () => {
    db.collection("cities")
      .orderBy("population")
      .startAfter(lastVisible)
      .limit(25);
  }

  return (
    <div>
      <InfiniteScroll
        dataLength={items.length} //This is important field to render the next data
        next={next}
        hasMore={true}
        loader={<h4>Loading...</h4>}
        endMessage={
          <p style={{ textAlign: 'center' }}>
            <b>Yay! You have seen it all</b>
          </p>
        }
        // below props only if you need pull down functionality
        refreshFunction={this.refresh}
        pullDownToRefresh
        pullDownToRefreshContent={
          <h3 style={{ textAlign: 'center' }}>&#8595; Pull down to refresh</h3>
        }
        releaseToRefreshContent={
          <h3 style={{ textAlign: 'center' }}>&#8593; Release to refresh</h3>
        }>
        {items}
      </InfiniteScroll>
    </div>
  )
}