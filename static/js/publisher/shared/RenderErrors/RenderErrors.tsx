type Props = {
  errors: { [key: string]: Array<string> };
};

function RenderErrors({ errors }: Props) {
  return (
    <div className="p-notification--negative">
      <div className="p-notification__content">
        <p className="p-notification__message">
          {Object.keys(errors).map((fileName) => (
            <span key={`errors-${fileName}`}>
              {fileName}
              &nbsp;
              {errors[fileName].map((error, index: number) => (
                <span key={`errors-${fileName}-${index}`}>
                  {error}
                  <br />
                </span>
              ))}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

export default RenderErrors;
