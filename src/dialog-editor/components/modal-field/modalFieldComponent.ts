import { AbstractModal, ModalController } from '../abstractModal';

/**
 * @memberof miqStaticAssets
 * @ngdoc component
 * @name dialogEditorModalField
 * @description
 *    Component contains templates for the modal for editing dialog editors
 *    field (group) details
 * @example
 * <dialog-editor-modal-field></dialog-editor-modal-field>
 */
export default class ModalField extends AbstractModal {
  public template = require('./field.html');
  public controller = ModalFieldController;
}

class ModalFieldController extends ModalController {
  public treeOptions: any;
  public modalData: any;
  public validation: any;
  public $scope: any;

  public $onInit() {
    this.treeOptions = {
      ...this.treeOptions,

      show: false,
      includeDomain: false,
      data: null,
      automationType: null,
      automationTypes: {
        automate: 'embedded_automate',
        workflows: 'embedded_workflows',
      },

      /** Function to reset the automation entries when the Automation Type drop down is changed. */
      resetAutomationEntries: () => {
        if (this.modalData.resource_action) {
          const actionKeys = ['ae_namespace', 'ae_class', 'ae_instance', 'ae_id'];
          actionKeys.forEach((item) => {
            if (Object.keys(this.modalData.resource_action).includes(item)) {
              this.modalData.resource_action =  {
                ...this.modalData.resource_action,
                [item]: '',
              };
            }
          });
        }
      },

      /** Function to reset the modalData while changin the Automation Type. */
      onAutomationTypeChange: () => {
        this.treeOptions.automationType = this.modalData.automation_type;
        this.treeOptions.resetAutomationEntries();
        console.log(this.modalData);
      },

      /** Function to open the modal box and load the automate tree. */
      toggle: () => {
        this.treeOptions.show = ! this.treeOptions.show;
        this.treeOptions.automationType = this.treeOptions.automationTypes.automate;

        if (this.treeOptions.show) {
          const fqname = this.showFullyQualifiedName(this.modalData.resource_action) || null;
          this.treeOptions.load(fqname).then((data) => {
            this.treeOptions.data = data;
            this.treeOptions.selected = {fqname: '/' + fqname};
          });
        }
      },

      /** Function to open the modal box and load the workflows list. */
      toggleWorkflows: () => {
        this.treeOptions.show = ! this.treeOptions.show;
        this.treeOptions.automationType = this.treeOptions.automationTypes.workflows;

        if (this.treeOptions.show) {
          const fqname = this.showFullyQualifiedName(this.modalData.resource_action) || null;
          this.treeOptions.loadWorkflows().then((data) => {
            this.treeOptions.data = data.resources.filter((item: any) => item.payload);
            this.treeOptions.selected = {fqname: '/' + fqname};
          });
        }
      },

      /** Function to handle the onclick event of an item in tree. */
      onSelect: (node) => {
        this.treeSelectorSelect(node, this.modalData);
      }
    };
  }

  public showFullyQualifiedName(resourceAction) {
    if (!resourceAction) {
      return '';
    }
    const actionKeys = ['ae_namespace', 'ae_class', 'ae_instance'];
    const keysPresent = actionKeys.every((item) => Object.keys(resourceAction).includes(item));

    if (keysPresent && resourceAction.ae_namespace && resourceAction.ae_class && resourceAction.ae_instance) {
      return `${resourceAction.ae_namespace}/${resourceAction.ae_class}/${resourceAction.ae_instance}`;
    } else {
      return '';
    }
  }

  /** Function to extract the values needed for embedded_automate during onclick event of an item from the tree */
  public onEmbeddedAutomateSelect(node, elementData) {
    const fqname = node.fqname.split('/');

    if (this.treeOptions.includeDomain === false) {
      fqname.splice(1, 1);
    }
    if (elementData.resource_action) {
      elementData.resource_action = {
        ...elementData.resource_action,
        ae_instance: fqname.pop(),
        ae_class: fqname.pop(),
        ae_namespace: fqname.filter(String).join('/'),
        ae_id: node.key,
      };
    }
  }

  /** Function to extract the values needed for embedded_workflows during onclick event of an item from the list */
  public onEmbeddedWorkflowsSelect(workflow, elementData) {
    if (elementData.resource_action) {
      elementData.resource_action = {
        ...elementData.resource_action,
        ae_instance: workflow.name,
        ae_class: 'workflows', // TODO: Not sure what to give here or is this required
        ae_namespace: 'configuration_script_payload', // TODO: Not sure what to give here or is this required
        ae_id: workflow.id,
      };
    }
  }

  /** Function to extract the values needed for entry points during onclick event of an item from the tree or list */
  public treeSelectorSelect(node, elementData) {
    if (this.treeOptions.automationType === this.treeOptions.automationTypes.automate) {
      this.onEmbeddedAutomateSelect(node, elementData);
    } else if (this.treeOptions.automationType === this.treeOptions.automationTypes.workflows) {
      this.onEmbeddedWorkflowsSelect(node, elementData);
    }
    this.treeOptions.show = false;
  }

  public modalFieldIsValid() {
    return this.validation.validateField(this.modalData);
  }
}
