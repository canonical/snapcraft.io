function initSnapIconEdit(iconElId, iconInputId) {
  const snapIconInput = document.getElementById(iconInputId);
  const snapIconEl = document.getElementById(iconElId);

  snapIconInput.addEventListener("change", function(){
    const fileList = this.files;
    snapIconEl.src = URL.createObjectURL(fileList[0]);
  });

  snapIconEl.addEventListener("click", function() {
    snapIconInput.click();
  });
}

function initFormNotification(formElId, notificationElId) {
  var form = document.getElementById(formElId);

  form.addEventListener("change", function() {
    var notification = document.getElementById(notificationElId);
    if (notification) {
      notification.parentNode.removeChild(notification);
    }
  });
  var notification = document.getElementById(notificationElId);

  if (notification) {
    setTimeout(function(){
      notification.parentNode.removeChild(notification);
    }, 20000);
  }
}

const market = {
  initSnapIconEdit,
  initFormNotification
};

export default market;
