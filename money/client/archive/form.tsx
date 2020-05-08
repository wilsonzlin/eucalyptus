

const getFormElementValue = (elem: Element): FormElementValue => {
  if (elem instanceof HTMLInputElement) {
    switch (elem.type) {
    case 'text':
      return elem.value;
    case 'checkbox':
      return elem.checked;
    case 'radio':
      return elem.checked ? elem.value : undefined;
    case 'file':
      return elem.files![0];
    case 'number':
      return elem.valueAsNumber;
    }
  } else if (elem instanceof HTMLTextAreaElement) {
    return elem.value;
  }
  return undefined;
};
