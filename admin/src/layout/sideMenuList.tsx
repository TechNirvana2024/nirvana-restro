import {
  MdDisplaySettings,
  MdOutlineFactCheck,
  MdOutlineMailOutline,
  MdOutlinePerson,
} from "react-icons/md";

import {
  Users,
  ImageIcon,
  SearchIcon,
  Mail,
  Settings,
  UserCheck,
  MessageCircle,
  Tag,
  MenuIcon,
} from "lucide-react";

export type SideListMenuType = {
  key: number;
  name: string;
  icon: React.ReactNode;
  path?: string;
  menu?: SideListMenuType[];
};

export const SideMenuList: SideListMenuType[] = [
  {
    key: 1,
    name: "Product Menu",
    icon: <MenuIcon />,
    menu: [
      {
        key: 1.1,
        name: "Product Category",
        path: "/admin/product-category/list",
        icon: <MdOutlineFactCheck />,
      },
      {
        key: 1.2,
        name: "Product",
        path: "/admin/product/list",
        icon: <MdOutlineFactCheck />,
      },
      // {
      //   key: 3.3,
      //   name: "Product Variant",
      //   path: "/admin/product-variant/list",
      //   icon: <MdOutlineFactCheck />,
      // },
    ],
  },
  {
    key: 2,
    name: "Media",
    path: "/admin/media-category/list",
    icon: <ImageIcon />,
  },
  {
    key: 3,
    name: "Customer",
    icon: <UserCheck />,
    path: "/admin/customer",
  },
  {
    key: 4,
    name: "Contact",
    icon: <MessageCircle />,
    path: "/admin/contact",
  },
  {
    key: 5,
    name: "User Management",
    icon: <Users />,
    menu: [
      {
        key: 5.1,
        name: "Users",
        path: "/admin/auth/list",
        icon: <MdOutlinePerson />,
      },
      {
        key: 5.2,
        name: "Roles",
        path: "/admin/roles/list",
        icon: <MdOutlineFactCheck />,
      },
    ],
  },
  {
    key: 6,
    name: "Banner",
    path: "/admin/banner/list",
    icon: <Tag />,
  },
  {
    key: 7,
    name: "SEO",
    icon: <SearchIcon />,
    path: "/admin/seo/list",
  },
  {
    key: 8,
    name: "Email",
    icon: <Mail />,
    menu: [
      {
        key: 8.1,
        name: "Email Template",
        path: "/admin/email-template/list",
        icon: <MdOutlineMailOutline />,
      },
      {
        key: 8.2,
        name: "Email SMTP",
        path: "/admin/smtp",
        icon: <MdOutlineMailOutline />,
      },
    ],
  },
  {
    key: 9,
    name: "Settings",
    icon: <Settings />,
    menu: [
      {
        key: 9.1,
        name: "Company Settings",
        path: "/admin/settings/list",
        icon: <MdDisplaySettings />,
      },
      {
        key: 9.2,
        name: "Department",
        path: "/admin/department/list",
        icon: <MdOutlineFactCheck />,
      },
      {
        key: 9.3,
        name: "Floor",
        path: "/admin/floor/list",
        icon: <MdOutlineFactCheck />,
      },
      {
        key: 9.4,
        name: "Table",
        path: "/admin/table/list",
        icon: <MdOutlineFactCheck />,
      },
    ],
  },
];
