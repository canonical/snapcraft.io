import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@canonical/react-components";

import PageHeader from "../PageHeader";
import SaveAndPreview from "../SaveAndPreview";

function App() {
  const [listingData, setListingData] = useState(window.listingData);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({ defaultValues: listingData });

  const onSubmit = (data: any) => {
    console.log({ data });
  };

  return (
    <>
      <PageHeader snapName={listingData?.snap_name} />
      <Form onSubmit={handleSubmit(onSubmit)} className="p-form--stacked">
        <SaveAndPreview
          snapName={listingData?.snap_name}
          isDirty={isDirty}
          reset={reset}
        />
        <div className="row">
          <hr className="u-no-margin--bottom" />
        </div>

        {/* Only here to test the buttons */}
        <section className="p-strip">
          <div className="u-fixed-width">
            <input
              defaultValue={listingData?.snap_name}
              {...register("snap_name")}
            />
          </div>
        </section>
      </Form>
    </>
  );
}

export default App;
