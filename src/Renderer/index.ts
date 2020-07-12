import Tree from '../utils/tree'
import { replaceInTree, insertIntoTree } from '../utils/tree-manipulation'
import { findById } from '../utils/tree-reading'
import { ActionHandler } from '../actions/types'
import {
  BeagleUIElement,
  IdentifiableBeagleUIElement,
  ExecutionMode,
  ChildrenMetadataMap,
  BeagleView,
  ComponentTypeMetadata,
  TreeUpdateMode,
  Lifecycle,
  LifecycleHookMap,
} from '../types'
import Component from './Component'
import Navigation from './Navigation'
import Expression from './Expression'
import Action from './Action'
import Context from './Context'
import Styling from './Styling'
import TypeChecker from './TypeChecker'

interface Params {
  beagleView: BeagleView<any>,
  setTree: (tree: any) => void,
  typesMetadata: Record<string, ComponentTypeMetadata>,
  renderToScreen: (tree: any) => void,
  lifecycleHooks: LifecycleHookMap,
  childrenMetadata: ChildrenMetadataMap,
  executionMode: ExecutionMode,
  actionHandlers: Record<string, ActionHandler>,
}

function createRenderer({
  beagleView,
  setTree,
  typesMetadata,
  renderToScreen,
  lifecycleHooks,
  childrenMetadata,
  executionMode,
  actionHandlers,
}: Params) {
  function runGlobalLifecycleHook(viewTree: any, lifecycle: Lifecycle) {
    const hook = lifecycleHooks[lifecycle].global
    if (!hook) return viewTree
    const newTree = hook(viewTree)
    return newTree || viewTree
  }

  function runComponentLifecycleHook(component: any, lifecycle: Lifecycle) {
    const hook = lifecycleHooks[lifecycle].components[component._beagleComponent_]
    if (!hook) return
    const newComponent = hook(component)
    return newComponent || component
  }

  function runLifecycle<T extends BeagleUIElement>(viewTree: T, lifecycle: Lifecycle) {
    viewTree = runGlobalLifecycleHook(viewTree, lifecycle)
    return Tree.replaceEach(viewTree, component => (
      runComponentLifecycleHook(component, lifecycle)
    ))
  }
  
  function preProcess(viewTree: BeagleUIElement) {
    Tree.forEach(viewTree, (component) => {
      Component.formatChildrenProperty(component, childrenMetadata[component._beagleComponent_])
      Component.assignId(component)
      Navigation.preFetchViews(component)
    })

    return viewTree as IdentifiableBeagleUIElement
  }
  
  function takeViewSnapshot(
    viewTree: IdentifiableBeagleUIElement,
    anchor: string,
    mode: TreeUpdateMode,
  ) {
    if (!anchor || viewTree.id === anchor) {
      setTree(viewTree)
      return
    }

    const currentTree = beagleView.getTree()
    if (mode === 'replaceComponent') {
      replaceInTree(currentTree, viewTree, anchor)
    } else {
      insertIntoTree(currentTree, viewTree, anchor, mode)
    }
    setTree(currentTree)
  }
  
  function evaluateComponents(viewTree: IdentifiableBeagleUIElement) {
    const contextMap = Context.evaluate(viewTree)
    Tree.forEach(viewTree, (component) => {
      Action.deserialize({
        component,
        contextHierarchy: contextMap[component.id],
        actionHandlers,
        beagleView,
      })
      Expression.resolve(component, contextMap[component.id])
      Styling.convert(component)
    })
  }

  function checkTypes(viewTree: IdentifiableBeagleUIElement) {
    if (executionMode !== 'development') return
    Tree.forEach(viewTree, component => (
      TypeChecker.check(component, typesMetadata[component.id], childrenMetadata[component.id])
    ))
  }

  /**
   * Does a partial render to the BeagleView. Compared to the full render, it will skip every step
   * until the view snapshot, i.e, it will start by taking the view snapshot and end doing a render
   * to the screen. Useful when updating a view that has already been rendered. If the `viewTree`
   * hasn't been rendered before, you should use `doFullRender` instead.
   * 
   * To see the full documentation of the renderization process, please follow this link:
   * https://github.com/ZupIT/beagle-web-core/blob/master/docs/renderization.md
   * 
   * @param viewTree the new tree to render, can be just a new branch to add to the current tree
   * @param anchor `viewTree` may be just a branch if not the entire view will be modified. In this
   * case, `anchor` must be specified, it is the id of the component to attach `viewTree` to.
   * @param mode when `viewTree` is just a new branch to be added to the tree, the mode must be
   * specified. It can be `append`, `prepend` or `replace`.
   */
  function doPartialRender(
    viewTree: IdentifiableBeagleUIElement<any>,
    anchor = '',
    mode: TreeUpdateMode = 'replaceComponent',
  ) {
    takeViewSnapshot(viewTree, anchor, mode)
    const currentViewTree = beagleView.getTree() as IdentifiableBeagleUIElement
    /* if we're updating just a portion of the tree, we don't need to reprocess everything, let's
    process only the desired branch */
    let branch = findById(currentViewTree, anchor) || currentViewTree
    branch = runLifecycle(branch, 'afterViewSnapshot')
    evaluateComponents(branch)
    branch = runLifecycle(branch, 'beforeRender')
    checkTypes(branch)
    // we must render the entire tree to the screen, not just the branch we've been updating
    if (viewTree.id !== branch.id) replaceInTree(viewTree, branch, anchor)
    renderToScreen(viewTree)
  }
  
  /**
   * Does a full render to the BeagleView. A full render means that every renderization step will
   * be executed for the tree passed as parameter. If `viewTree` has been rendered at least once,
   * you should call `doPartialRender` instead.
   * 
   * To see the full documentation of the renderization process, please follow this link:
   * https://github.com/ZupIT/beagle-web-core/blob/master/docs/renderization.md
   * 
   * @param viewTree the new tree to render, can be just a new branch to add to the current tree
   * @param anchor `viewTree` may be just a branch if not the entire view will be modified. In this
   * case, `anchor` must be specified, it is the id of the component to attach `viewTree` to.
   * @param mode when `viewTree` is just a new branch to be added to the tree, the mode must be
   * specified. It can be `append`, `prepend` or `replace`.
   */
  function doFullRender(
    viewTree: BeagleUIElement<any>,
    anchor = '',
    mode: TreeUpdateMode = 'replaceComponent',
  ) {
    viewTree = runLifecycle(viewTree, 'beforeStart')
    let viewTreeWithIds = preProcess(viewTree)
    viewTreeWithIds = runLifecycle(viewTreeWithIds, 'beforeViewSnapshot')
    doPartialRender(viewTreeWithIds, anchor, mode)
  }

  return {
    doPartialRender,
    doFullRender,
  }
}

export default createRenderer
