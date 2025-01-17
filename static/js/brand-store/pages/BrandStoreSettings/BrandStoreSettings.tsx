import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import {
  Row,
  Col,
  Spinner,
  Form,
  Input,
  PasswordToggle,
  Button,
} from "@canonical/react-components";

import Navigation from "../../components/Navigation";

function BrandStoreSettings() {
  const { id } = useParams();
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [manualReviewPolicy, setManualReviewPolicy] = useState<string>();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { data, isLoading, status, refetch } = useQuery({
    queryKey: ["currentStore"],
    queryFn: async () => {
      const response = await fetch(`/api/store/${id}`);

      if (!response.ok) {
        throw new Error("Unable to fetch store");
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error("Unable to fetch store");
      }

      return responseData.data;
    },
  });

  const formDisabled = () => {
    if (!data) {
      return true;
    }

    if (isPrivate !== data.private) {
      return false;
    }

    if (manualReviewPolicy !== data["manual-review-policy"]) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (data) {
      setIsPrivate(data.private);
      setManualReviewPolicy(data["manual-review-policy"]);
    }
  }, [data]);

  return (
    <div className="l-application">
      <Navigation sectionName="settings" />
      <main className="l-main">
        <div className="p-panel--settings">
          <div className="p-panel__content">
            {isLoading && (
              <div className="u-fixed-width">
                <Spinner text="Loading..." />
              </div>
            )}

            {!isLoading && status === "success" && data && (
              <>
                <div className="u-fixed-width">
                  <h1 className="p-heading--4">{data.name} / Settings</h1>
                </div>
                <Row>
                  <Col size={7}>
                    <Form
                      onSubmit={async (e) => {
                        e.preventDefault();

                        setIsSaving(true);

                        const formData = new FormData();
                        formData.set("csrf_token", window.CSRF_TOKEN);
                        formData.set("store-id", id || "");
                        formData.set("private", isPrivate.toString());
                        formData.set(
                          "manual-review-policy",
                          manualReviewPolicy || "",
                        );

                        const response = await fetch(
                          `/api/store/${id}/settings`,
                          { method: "PUT", body: formData },
                        );

                        if (!response.ok) {
                          throw new Error("Unable to save settings");
                        }

                        setTimeout(() => {
                          setIsSaving(false);
                        }, 1500);

                        refetch();
                      }}
                      autoComplete="off"
                    >
                      <Input
                        id="is_public"
                        label="Include this store in public lists"
                        type="checkbox"
                        help="This store will not be listed in the store dropdowns like the one in the snap name registration form."
                        onChange={() => {
                          setIsPrivate(!isPrivate);
                        }}
                        checked={!isPrivate}
                      />

                      <PasswordToggle
                        defaultValue={id}
                        readOnly={true}
                        label="Store ID"
                        id="store-id"
                      />

                      <h2 className="p-heading--4" id="store-id-label">
                        Manual review policy
                      </h2>
                      <Input
                        type="radio"
                        label="Allow"
                        help="Normal review behaviour will be applied, using the result from the automatic review tool checks."
                        name="manual-review-policy"
                        id="manual-review-policy-label-allow"
                        aria-labelledby="store-id-label"
                        value="allow"
                        onChange={(e) => {
                          setManualReviewPolicy(e.target.value);
                        }}
                        checked={manualReviewPolicy === "allow"}
                      />
                      <Input
                        type="radio"
                        label="Avoid"
                        help="No snap will be left in the manual review queue, even if the automatic review tool found no issues."
                        name="manual-review-policy"
                        id="manual-review-policy-label-avoid"
                        value="avoid"
                        onChange={(e) => {
                          setManualReviewPolicy(e.target.value);
                        }}
                        checked={manualReviewPolicy === "avoid"}
                      />
                      <Input
                        type="radio"
                        label="Require"
                        help="Every snap will be moved to the review queue, even if the automatic review tool found no issues."
                        name="manual-review-policy"
                        id="manual-review-policy-label-require"
                        value="require"
                        onChange={(e) => {
                          setManualReviewPolicy(e.target.value);
                        }}
                        checked={manualReviewPolicy === "require"}
                      />

                      <hr />

                      <div className="u-align--right">
                        <Button
                          appearance="positive"
                          type="submit"
                          disabled={formDisabled() || isSaving}
                          className={isSaving ? "has-icon" : ""}
                        >
                          {isSaving ? (
                            <>
                              <i className="p-icon--spinner is-light u-animation--spin"></i>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>Save changes</>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </Col>
                </Row>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default BrandStoreSettings;
