import RouterLinkButton from "../../components/RouterLinkButton";

type Props = {
  snapName: string | null;
};

function RegisterNameDisputeSuccess({ snapName }: Props): React.JSX.Element {
  return (
    <>
      <h1 className="p-heading--2">
        Thank you for requesting the name <strong>{snapName}</strong>
      </h1>
      <p>We will proccess the details provided with the name dispute</p>
      <p>
        Each case is reviewed individually and we can't provide an estimate on
        how long it will take for us to process this information. We will
        contact you once we confirm the information provided
      </p>
      <hr />
      <RouterLinkButton
        importance="primary"
        anticipation="constructive"
        to="/snaps"
      >
        Return to my snaps
      </RouterLinkButton>
    </>
  );
}

export default RegisterNameDisputeSuccess;
