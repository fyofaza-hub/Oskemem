import type { ComponentProps } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import homeIcon from "@iconify-icons/iconmind/home-outline-regular";
import compassIcon from "@iconify-icons/iconmind/compass-outline-regular";
import navigateIcon from "@iconify-icons/iconmind/navigate-outline-regular";
import mapIcon from "@iconify-icons/iconmind/map-outline-regular";
import routeIcon from "@iconify-icons/iconmind/route-alt-outline-regular";
import routePlannerIcon from "@iconify-icons/iconmind/route-planner-outline-regular";
import calendarIcon from "@iconify-icons/iconmind/calendar-outline-regular";
import calendarAddIcon from "@iconify-icons/iconmind/calendar-add-outline-regular";
import calendarDaysIcon from "@iconify-icons/iconmind/calendar-days-outline-regular";
import calendarOffIcon from "@iconify-icons/iconmind/calendar-off-outline-regular";
import chatIcon from "@iconify-icons/iconmind/chat-dot-outline-regular";
import messageIcon from "@iconify-icons/iconmind/message-outline-regular";
import heartIcon from "@iconify-icons/iconmind/heart-outline-regular";
import bookmarkIcon from "@iconify-icons/iconmind/bookmark-outline-regular";
import userIcon from "@iconify-icons/iconmind/user-outline-regular";
import usersIcon from "@iconify-icons/iconmind/users-outline-regular";
import coupleIcon from "@iconify-icons/iconmind/couple-outline-regular";
import friendsIcon from "@iconify-icons/iconmind/friends-outline-regular";
import familyIcon from "@iconify-icons/iconmind/family-outline-regular";
import searchIcon from "@iconify-icons/iconmind/search-outline-regular";
import plusIcon from "@iconify-icons/iconmind/plus-outline-regular";
import locationIcon from "@iconify-icons/iconmind/location-outline-regular";
import globeIcon from "@iconify-icons/iconmind/globe-outline-regular";
import sunIcon from "@iconify-icons/iconmind/sun-outline-regular";
import moonIcon from "@iconify-icons/iconmind/moon-outline-regular";
import settingsIcon from "@iconify-icons/iconmind/settings-outline-regular";
import logoutIcon from "@iconify-icons/iconmind/logout-outline-regular";
import gridIcon from "@iconify-icons/iconmind/grid-outline-regular";
import layersIcon from "@iconify-icons/iconmind/layers-outline-regular";
import filterIcon from "@iconify-icons/iconmind/filter-outline-regular";
import sortIcon from "@iconify-icons/iconmind/sort-outline-regular";
import shareIcon from "@iconify-icons/iconmind/share-outline-regular";
import clockIcon from "@iconify-icons/iconmind/clock-outline-regular";
import ticketIcon from "@iconify-icons/iconmind/event-ticket-outline-regular";
import walletIcon from "@iconify-icons/iconmind/wallet-outline-regular";
import coinsIcon from "@iconify-icons/iconmind/coins-outline-regular";
import giftIcon from "@iconify-icons/iconmind/gift-box-outline-regular";
import distanceIcon from "@iconify-icons/iconmind/distance-outline-regular";
import crosshairIcon from "@iconify-icons/iconmind/crosshair-outline-regular";
import coffeeIcon from "@iconify-icons/iconmind/coffee-cup-outline-regular";
import treeIcon from "@iconify-icons/iconmind/tree-outline-regular";
import filmIcon from "@iconify-icons/iconmind/film-roll-outline-regular";
import museumIcon from "@iconify-icons/iconmind/museum-outline-regular";
import runningIcon from "@iconify-icons/iconmind/running-outline-regular";
import landmarkIcon from "@iconify-icons/iconmind/landmark-outline-regular";
import waveIcon from "@iconify-icons/iconmind/wave-outline-regular";
import checkIcon from "@iconify-icons/iconmind/check-outline-regular";
import closeIcon from "@iconify-icons/iconmind/close-outline-regular";
import arrowLeftIcon from "@iconify-icons/iconmind/arrow-left-outline-regular";
import arrowRightIcon from "@iconify-icons/iconmind/arrow-right-outline-regular";
import arrowUpIcon from "@iconify-icons/iconmind/arrow-up-outline-regular";
import arrowDownIcon from "@iconify-icons/iconmind/arrow-down-outline-regular";
import chevronLeftIcon from "@iconify-icons/iconmind/chevron-left-outline-regular";
import chevronRightIcon from "@iconify-icons/iconmind/chevron-right-outline-regular";
import chevronDownIcon from "@iconify-icons/iconmind/chevron-down-outline-regular";
import editIcon from "@iconify-icons/iconmind/edit-outline-regular";
import cameraIcon from "@iconify-icons/iconmind/camera-outline-regular";
import imageIcon from "@iconify-icons/iconmind/image-outline-regular";
import galleryIcon from "@iconify-icons/iconmind/gallery-outline-regular";
import uploadIcon from "@iconify-icons/iconmind/upload-outline-regular";
import trashIcon from "@iconify-icons/iconmind/trash-outline-regular";
import copyIcon from "@iconify-icons/iconmind/copy-outline-regular";
import refreshIcon from "@iconify-icons/iconmind/refresh-outline-regular";
import saveIcon from "@iconify-icons/iconmind/save-outline-regular";
import sendIcon from "@iconify-icons/iconmind/send-outline-regular";
import visibilityIcon from "@iconify-icons/iconmind/visibility-outline-regular";
import eyeOffIcon from "@iconify-icons/iconmind/eye-off-outline-regular";
import mailIcon from "@iconify-icons/iconmind/mail-outline-regular";
import lockIcon from "@iconify-icons/iconmind/lock-outline-regular";
import shieldIcon from "@iconify-icons/iconmind/shield-outline-regular";
import infoIcon from "@iconify-icons/iconmind/info-outline-regular";
import warningIcon from "@iconify-icons/iconmind/warning-outline-regular";
import alertIcon from "@iconify-icons/iconmind/alert-outline-regular";
import downloadIcon from "@iconify-icons/iconmind/download-outline-regular";
import linkIcon from "@iconify-icons/iconmind/link-outline-regular";
import notebookIcon from "@iconify-icons/iconmind/notebook-outline-regular";
import clipboardIcon from "@iconify-icons/iconmind/clipboard-outline-regular";

const iconRegistry = {
  home: homeIcon,
  guide: compassIcon,
  plan: navigateIcon,
  map: mapIcon,
  routes: routeIcon,
  routePlanner: routePlannerIcon,
  events: calendarIcon,
  calendarAdd: calendarAddIcon,
  calendarDays: calendarDaysIcon,
  calendarOff: calendarOffIcon,
  feed: chatIcon,
  comment: messageIcon,
  heart: heartIcon,
  bookmark: bookmarkIcon,
  user: userIcon,
  users: usersIcon,
  couple: coupleIcon,
  friends: friendsIcon,
  family: familyIcon,
  search: searchIcon,
  plus: plusIcon,
  location: locationIcon,
  globe: globeIcon,
  sun: sunIcon,
  moon: moonIcon,
  settings: settingsIcon,
  logout: logoutIcon,
  more: gridIcon,
  grid: gridIcon,
  layers: layersIcon,
  filter: filterIcon,
  sort: sortIcon,
  share: shareIcon,
  clock: clockIcon,
  ticket: ticketIcon,
  wallet: walletIcon,
  coins: coinsIcon,
  gift: giftIcon,
  distance: distanceIcon,
  crosshair: crosshairIcon,
  coffee: coffeeIcon,
  tree: treeIcon,
  film: filmIcon,
  museum: museumIcon,
  running: runningIcon,
  landmark: landmarkIcon,
  wave: waveIcon,
  check: checkIcon,
  close: closeIcon,
  arrowLeft: arrowLeftIcon,
  arrowRight: arrowRightIcon,
  arrowUp: arrowUpIcon,
  arrowDown: arrowDownIcon,
  chevronLeft: chevronLeftIcon,
  chevronRight: chevronRightIcon,
  chevronDown: chevronDownIcon,
  edit: editIcon,
  camera: cameraIcon,
  image: imageIcon,
  gallery: galleryIcon,
  upload: uploadIcon,
  trash: trashIcon,
  copy: copyIcon,
  refresh: refreshIcon,
  save: saveIcon,
  send: sendIcon,
  eye: visibilityIcon,
  eyeOff: eyeOffIcon,
  mail: mailIcon,
  lock: lockIcon,
  shield: shieldIcon,
  info: infoIcon,
  warning: warningIcon,
  alert: alertIcon,
  download: downloadIcon,
  link: linkIcon,
  notebook: notebookIcon,
  clipboard: clipboardIcon,
};

export type IconName = keyof typeof iconRegistry;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Единый набор иконок Iconmind (outline, regular) через @iconify/react.
 * Данные подключены локально, без обращения к сети.
 */
export function Icon({ name, size = 18, className, label }: IconProps) {
  const icon: ComponentProps<typeof IconifyIcon>["icon"] = iconRegistry[name];
  return (
    <IconifyIcon
      icon={icon}
      width={size}
      height={size}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    />
  );
}
