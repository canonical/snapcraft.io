import React from "react";

import ListingFormInput from "../../components/ListingFormInput";

type Props = {
  getFieldState: Function;
  register: Function;
  publisherName: string;
};

function ContactInformationSection({
  getFieldState,
  register,
  publisherName,
}: Props) {
  return (
    <>
      <div className="u-fixed-width">
        <h2 className="p-heading--4">Contact information</h2>
      </div>

      <ListingFormInput
        type="url"
        label="Developer website"
        name="website"
        register={register}
        placeholder="https://snapcraft.io"
        helpText="Please include a valid http:// or https:// link"
        getFieldState={getFieldState}
        pattern={
          /^https?:\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/
        }
      />

      <ListingFormInput
        type="text"
        label={`Contact ${publisherName}`}
        name="contact"
        register={register}
        placeholder="mailto:example@example.com"
        helpText="An http: or https: link, or an e-mail address"
        getFieldState={getFieldState}
        pattern={
          /(^https?:\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$)|(^mailto:)?([a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$)/
        }
      />
    </>
  );
}

export default ContactInformationSection;
