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

    /** Function to load the selected workflow if  configuration_script_id is available. */
    if (this.modalData.resource_action && this.modalData.resource_action.configuration_script_id) {
      this.loadWorkflow(this.modalData.resource_action.configuration_script_id);
    };

    this.treeOptions = {
      ...this.treeOptions,

      show: false,
      includeDomain: false,
      data: null,
      automationType: null,
      automationTypes: {
        automate: 'embedded_automate',
        workflow: 'embedded_workflow', // TODO: need to check if this can be resued from classic repo's dialog_editor_controller.js
      },

      /** Function to reset the automation entries when the Automation Type drop down is changed. */
      resetAutomationEntries: () => {
        const resetFields = { // TODO: need to check if this can be resued from classic repo's dialog_editor_controller.js
          automate: ['ae_namespace', 'ae_class', 'ae_instance', 'ae_message'],
          workflow: ['configuration_script_id', 'workflow_name'],
        };

        if (this.modalData.resource_action) {
          const isEmbeddedAutomate = this.modalData.automation_type === this.treeOptions.automationTypes.automate;
          const resetEntries =  isEmbeddedAutomate ? resetFields.workflow : resetFields.automate;
          resetEntries.forEach((item) => {
            if (this.modalData.resource_action.hasOwnProperty(item)) {
              this.modalData.resource_action = {
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
        this.treeOptions.automationType = this.treeOptions.automationTypes.workflow;

        if (this.treeOptions.show) {
          this.treeOptions.loadAvailableWorkflows().then((data) => {
            this.treeOptions.data = data.resources.filter((item: any) => item.payload);
            const workflow = this.treeOptions.data.find((item) => item.id === this.modalData.resource_action.configuration_script_id);
            this.treeOptions.selected = workflow ? workflow.name : null;
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
    const keysPresent = actionKeys.every((item) => resourceAction.hasOwnProperty(item));

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
      };
    }
  }

  /** Function to extract the values needed for embedded_workflow during onclick event of an item from the list */
  public onEmbeddedWorkflowsSelect(workflow, elementData) {
    if (elementData.resource_action) {
      elementData.resource_action = {
        ...elementData.resource_action,
        configuration_script_id: workflow.id,
        workflow_name: workflow.name,
      };
    }
  }

  /** Function to extract the values needed for entry points during onclick event of an item from the tree or list */
  public treeSelectorSelect(node, elementData) {
    if (this.treeOptions.automationType === this.treeOptions.automationTypes.automate) {
      this.onEmbeddedAutomateSelect(node, elementData);
    } else if (this.treeOptions.automationType === this.treeOptions.automationTypes.workflow) {
      this.onEmbeddedWorkflowsSelect(node, elementData);
    }
    this.treeOptions.show = false;
    console.log('222 treeSelectorSelect', this.modalData.resource_action);
  }

  public modalFieldIsValid() {
    return this.validation.validateField(this.modalData);
  }

  /** Function to load a selected workflow. */
  public loadWorkflow(id) {
    this.treeOptions.loadWorkflow(id).then((workflow) => {
      this.modalData.resource_action.workflow_name = workflow.name;
    });
  }
}
