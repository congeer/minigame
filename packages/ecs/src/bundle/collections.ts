import { Constructor, HashMap, Option, typeId, TypeId, useTrait, Vec } from 'rustable';
import { Components } from '../component/collections';
import { ComponentInfo } from '../component/info';
import { ComponentId, StorageType } from '../component/types';
import { Storages } from '../storage/storages';
import { Bundle } from './base';
import { BundleInfo } from './info';
import { BundleId } from './types';

export class Bundles {
  bundleInfos: Vec<BundleInfo> = Vec.new();
  bundleIds: HashMap<TypeId, BundleId> = new HashMap();
  contributedBundleIds: HashMap<TypeId, BundleId> = new HashMap();
  dynamicBundleIds: HashMap<Vec<ComponentId>, BundleId> = new HashMap();
  dynamicBundleStorages: HashMap<BundleId, Vec<StorageType>> = new HashMap();
  dynamicComponentBundleIds: HashMap<ComponentId, BundleId> = new HashMap();
  dynamicComponentStorages: HashMap<BundleId, StorageType> = new HashMap();

  get(bundleId: BundleId): Option<BundleInfo> {
    return this.bundleInfos.get(bundleId);
  }

  getUnchecked(bundleId: BundleId): BundleInfo {
    return this.bundleInfos[bundleId];
  }

  getId(typeId: TypeId): Option<BundleId> {
    return this.bundleIds.get(typeId);
  }

  registerInfo<T extends object>(bundle: Constructor<T>, components: Components, storages: Storages): BundleId {
    const bundleInfos = this.bundleInfos;
    return this.bundleIds.entry(typeId(bundle)).orInsertWith(() => {
      const componentIds: Vec<ComponentId> = Vec.new();
      useTrait(bundle, Bundle).componentIds(components, storages, (componentId: ComponentId) => {
        componentIds.push(componentId);
      });
      const id = bundleInfos.len();
      const bundleInfo = BundleInfo.new(typeId(bundle), components, componentIds, id);
      bundleInfos.push(bundleInfo);
      return id;
    });
  }

  registerContributedBundleInfo<T extends object>(
    bundle: Constructor<T>,
    components: Components,
    storages: Storages,
  ): BundleId {
    return this.contributedBundleIds.get(typeId(bundle)).match({
      Some: (id) => id,
      None: () => {
        const explicitBundleId = this.registerInfo<T>(bundle, components, storages);
        const contributedComponents = this.getUnchecked(explicitBundleId).contributedComponents();
        const id = this.initDynamicInfo(components, Vec.from(contributedComponents));
        this.contributedBundleIds.insert(typeId(bundle), id);
        return id;
      },
    });
  }
  /**
   * # Safety
   * This BundleId must have been initialized with a single Component (via initComponentInfo)
   */
  getStorageUnchecked(id: BundleId): StorageType {
    return this.dynamicComponentStorages.get(id).unwrap();
  }

  /**
   * # Safety
   * This BundleId must have been initialized with multiple Components (via initDynamicInfo)
   */
  getStoragesUnchecked(id: BundleId): Vec<StorageType> {
    return this.dynamicBundleStorages.get(id).unwrap();
  }

  initDynamicInfo(components: Components, componentIds: Vec<ComponentId>): BundleId {
    const bundleInfos = this.bundleInfos;

    // Get or initialize the bundle ID for these component IDs
    const bundleId = this.dynamicBundleIds.entry(componentIds).orInsertWith(() => {
      const [id, storages] = initializeDynamicBundle(bundleInfos, components, componentIds);
      // SAFETY: The ID always increases when new bundles are added, so ID is unique
      this.dynamicBundleStorages.insert(id, storages);
      return id;
    });

    return bundleId;
  }

  initComponentInfo(components: Components, componentId: ComponentId): BundleId {
    const bundleInfos = this.bundleInfos;
    const bundleId = this.dynamicComponentBundleIds.entry(componentId).orInsertWith(() => {
      const [id, storageTypes] = initializeDynamicBundle(bundleInfos, components, Vec.from([componentId]));
      this.dynamicComponentStorages.insert(id, storageTypes[0]);
      return id;
    });
    return bundleId;
  }
}

function initializeDynamicBundle(
  bundleInfos: Vec<BundleInfo>,
  components: Components,
  componentIds: Vec<ComponentId>,
): [BundleId, Vec<StorageType>] {
  // Assert component existence
  const storageTypes = componentIds
    .iter()
    .map((id) => {
      const info = components.getInfo(id).unwrapOrElse<ComponentInfo>(() => {
        throw new Error(`initDynamicInfo called with component id ${id} which doesn't exist in this world`);
      });
      return info.storageType;
    })
    .collectInto((v) => Vec.from(v));

  const id = bundleInfos.len();
  // SAFETY: component_ids are valid as they were just checked
  const bundleInfo = BundleInfo.new('<dynamic bundle>', components, Vec.from(componentIds), id);
  bundleInfos.push(bundleInfo);

  return [id, storageTypes];
}
