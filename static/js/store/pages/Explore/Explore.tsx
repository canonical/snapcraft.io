import { useRef, ReactNode } from "react";
import { Strip } from "@canonical/react-components";

import Banner from "../../components/Banner";
import MustHaveSnaps from "../../components/MustHaveSnaps";
import NewSnaps from "../../components/NewSnaps";
import TopRatedSnaps from "../../components/TopRatedSnaps";
import UpdatedSnaps from "../../components/UpdatedSnaps";
import PromoCategory from "../../PromoCategory";
import Categories from "../../components/Categories";
import PopularSnaps from "../../components/PopularSnaps";
import Blog from "../../components/Blog";
import LearnHowToSnap from "../../components/LearnHowToSnap";

function Explore(): ReactNode {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const searchSummaryRef = useRef<HTMLDivElement>(null);

  // Dummy data for now
  const mustHaveSnaps = [
    {
      name: "eclipse",
      display_name: "eclipse",
      icon_url:
        "https://dashboard.snapcraft.io/site_media/appmedia/2018/04/electron.png",
    },
    {
      name: "gitkraken",
      display_name: "GitKraken",
      icon_url:
        "https://dashboard.snapcraft.io/site_media/appmedia/2018/01/1.png",
    },
    {
      name: "notepadqq",
      display_name: "Notepaddqq",
      icon_url:
        "https://dashboard.snapcraft.io/site_media/appmedia/2018/02/icon.svg_7Eenexu.png",
    },
  ];

  return (
    <>
      <Banner searchRef={searchRef} searchSummaryRef={searchSummaryRef} />

      <Strip>
        <MustHaveSnaps
          snaps={mustHaveSnaps}
          category="developers"
          subheading="Lorem ipsum dolor sit amet, consectetur"
          gradientStart="#19224d"
          gradientEnd="#c481d1"
        />
      </Strip>

      <Strip shallow className="u-no-padding--top">
        <NewSnaps />
      </Strip>

      <Strip shallow className="u-no-padding--top">
        <TopRatedSnaps />
      </Strip>

      <Strip shallow className="u-no-padding--top">
        <PromoCategory />
      </Strip>

      <Strip shallow className="u-no-padding--top">
        <Categories />
      </Strip>

      <Strip>
        <MustHaveSnaps
          snaps={mustHaveSnaps}
          category="developers"
          subheading="Lorem ipsum dolor sit amet, consectetur"
        />
      </Strip>

      <Strip shallow className="u-no-padding--top">
        <PopularSnaps />
      </Strip>

      <Strip shallow className="u-no-padding--top">
        <Blog />
      </Strip>

      <Strip shallow>
        <UpdatedSnaps />
      </Strip>

      <Strip shallow className="u-no-padding--top">
        <PopularSnaps />
      </Strip>

      <Strip className="u-no-padding--top">
        <LearnHowToSnap />
      </Strip>
    </>
  );
}

export default Explore;
