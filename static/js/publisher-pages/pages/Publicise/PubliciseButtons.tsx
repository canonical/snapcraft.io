import { useState } from "react";
import { useParams } from "react-router-dom";
import { Row, Col, Select } from "@canonical/react-components";

const LANGUAGES = {
  ar: { title: "العربية", text: "احصل عليه من Snap Store" },
  bg: { title: "български", text: "Инсталирайте го от Snap Store" },
  bn: { title: "বাংলা", text: "থেকে ইনস্টল করুন" },
  de: { title: "Deutsch", text: "Installieren vom Snap Store" },
  en: { title: "English", text: "Get it from the Snap Store" },
  es: { title: "Español", text: "Instalar desde Snap Store" },
  fr: { title: "Français", text: "Installer à partir du Snap Store" },
  it: { title: "Italiano", text: "Scarica dallo Snap Store" },
  jp: { title: "日本語", text: "Snap Store から入手ください" },
  pl: { title: "Polski", text: "Pobierz w Snap Store" },
  pt: { title: "Português", text: "Disponível na Snap Store" },
  ro: { title: "Română", text: "Instalează din Snap Store" },
  ru: { title: "русский язык", text: "Загрузите из Snap Store" },
  tw: { title: "中文（台灣）", text: "安裝軟體敬請移駕 Snap Store" },
};

type LanguageKey = keyof typeof LANGUAGES;

function PubliciseButtons(): JSX.Element {
  const { snapId } = useParams();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKey>("en");

  const darkBadgeSource = `https://snapcraft.io/${selectedLanguage}/dark/install.svg`;
  const lightBadgeSource = `https://snapcraft.io/${selectedLanguage}/light/install.svg`;

  const htmlSnippetBlack = `<a href="https://snapcraft.io/${snapId}">
    <img alt="${LANGUAGES[selectedLanguage].text}" src=${darkBadgeSource} />
  </a>`;

  const htmlSnippetWhite = `<a href="https://snapcraft.io/${snapId}">
    <img alt="${LANGUAGES[selectedLanguage].text}" src=${lightBadgeSource} />
  </a>`;

  const markdownSnippetBlack = `[![${LANGUAGES[selectedLanguage].text}](${darkBadgeSource})](https://snapcraft.io/${snapId})`;

  const markdownSnippetWhite = `[![${LANGUAGES[selectedLanguage].text}](${lightBadgeSource})](https://snapcraft.io/${snapId})`;

  return (
    <>
      <Row>
        <Col size={2}>
          <p>Language:</p>
        </Col>
        <Col size={10}>
          <Select
            defaultValue={selectedLanguage}
            options={Object.entries(LANGUAGES).map((lang) => {
              return {
                label: lang[1].title,
                value: lang[0],
              };
            })}
            onChange={(e) => {
              setSelectedLanguage(e.target.value as LanguageKey);
            }}
            style={{ maxWidth: "180px" }}
          />
          <p>
            You can help translate these buttons{" "}
            <a href="https://github.com/snapcore/snap-store-badges">
              in this repository
            </a>
            .
          </p>
        </Col>
      </Row>
      <hr />
      <Row>
        <Col size={10}>
          <p>
            <img
              src={darkBadgeSource}
              alt="Get it from the Snap Store"
              width="182"
              height="56"
            />
          </p>
        </Col>
      </Row>
      <Row>
        <Col size={2}>
          <p>HTML:</p>
        </Col>
        <Col size={10}>
          <div className="p-code-snippet">
            <pre className="p-code-snippet__block">{htmlSnippetBlack}</pre>
          </div>
        </Col>
      </Row>
      <Row>
        <Col size={2}>
          <p>Markdown:</p>
        </Col>
        <Col size={10}>
          <div className="p-code-snippet">
            <pre className="p-code-snippet__block is-wrapped">
              {markdownSnippetBlack}
            </pre>
          </div>
        </Col>
      </Row>
      <hr />
      <Row>
        <Col size={10}>
          <p>
            <img
              src={lightBadgeSource}
              alt="Get it from the Snap Store"
              width="182"
              height="56"
            />
          </p>
        </Col>
      </Row>
      <Row>
        <Col size={2}>
          <p>HTML:</p>
        </Col>
        <Col size={10}>
          <div className="p-code-snippet">
            <pre className="p-code-snippet__block">{htmlSnippetWhite}</pre>
          </div>
        </Col>
      </Row>
      <Row>
        <Col size={2}>
          <p>Markdown:</p>
        </Col>
        <Col size={10}>
          <div className="p-code-snippet">
            <pre className="p-code-snippet__block is-wrapped">
              {markdownSnippetWhite}
            </pre>
          </div>
        </Col>
      </Row>
      <hr />
      <Row>
        <Col size={2}>
          <p>Download all:</p>
        </Col>
        <Col size={10}>
          <a
            className="p-button"
            href="https://github.com/snapcore/snap-store-badges/archive/v1.4.2.zip"
          >
            zip
          </a>
          <a
            className="p-button"
            href="https://github.com/snapcore/snap-store-badges/archive/v1.4.2.tar.gz"
          >
            tar.gz
          </a>
          <a href="https://raw.githubusercontent.com/snapcore/snap-store-badges/master/LICENSE.md">
            View image licence
          </a>
        </Col>
      </Row>
    </>
  );
}

export default PubliciseButtons;
