import { Controller, useForm } from "react-hook-form";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserSchema } from "./schema";
import { z } from "zod";
import {
  useCreateUserMutation,
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from "../../redux/services/authentication";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useEffect, useState } from "react";
import MediaComponent from "../../components/MediaComponent";
import { useAppSelector } from "../../redux/store/hooks";
import { useDispatch } from "react-redux";
import { clearSelectedMedia } from "../../redux/feature/mediaSlice";
import { useGetRoleQuery } from "../../redux/services/role";
import Select from "../../components/Select";
import { IMAGE_BASE_URL } from "@/constants";
import useTranslation from "@/locale/useTranslation";
import userImage from "@/assets/user_image.jpeg";
import { trimFormData } from "@/utils/validationHelper";

type UserFormType = z.infer<typeof UserSchema>;

type UserFormProps = {
  isOpen: boolean;
  editId: number | null;
  handleCloseDrawer: () => void;
};

const GenderOptions = [
  { label: "Male", value: "male" },
  {
    label: "Female",
    value: "female",
  },
  {
    label: "Others",
    value: "other",
  },
];

export default function UserForm({
  editId,
  handleCloseDrawer,
  isOpen,
}: Readonly<UserFormProps>) {
  const translate = useTranslation();
  const dispatch = useDispatch();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserFormType>({
    resolver: zodResolver(UserSchema),
  });

  const [openMedia, setOpenMedia] = useState<boolean>(false);
  const [roleOptions, setRoleOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [image, setImage] = useState<string>("");
  const selectedImage = useAppSelector((state) => state.media.selectedImage);

  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();

  const {
    data: getUser,
    isSuccess: success,
    refetch,
  } = useGetUserByIdQuery(editId, {
    skip: editId === null,
  });
  const { data: roles, isSuccess: roleSuccess } = useGetRoleQuery({
    page: 1,
    limit: 100,
  });

  useEffect(() => {
    if (editId !== null) {
      refetch();
      if (getUser?.data) {
        reset({ ...getUser.data, roleId: String(getUser.data.roleId) });
        setImage(getUser.data.imageUrl);
      }
    } else {
      reset({
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        mobileNo: "",
        mobilePrefix: "",
        roleId: "",
        gender: "",
        password: "",
      });
      setImage("");
    }
  }, [editId, getUser, refetch, reset, success]);

  useEffect(() => {
    if (roleSuccess && roles?.data?.data) {
      const options = roles?.data?.data.map((each) => ({
        label: each.title,
        value: each.id,
      }));
      setRoleOptions(options);
    }
  }, [roles, roleSuccess]);

  const handleConfirmImage = () => {
    setImage(selectedImage);
    dispatch(clearSelectedMedia());
    setOpenMedia(false);
  };

  const onSubmit = async (data: any) => {
    const trimmedData = trimFormData(data);
    const body = {
      ...trimmedData,
      roleId: String(data.roleId),
      isActive: true,
      imageUrl: image ? image : null,
    };
    if (editId === null) {
      try {
        const response = await createUser(body).unwrap();
        handleResponse({
          res: response,
          onSuccess: handleCloseDrawer,
        });
      } catch (error) {
        handleError({ error, setError });
      } finally {
        reset({
          username: "",
          email: "",
          firstName: "",
          lastName: "",
          mobileNo: "",
          mobilePrefix: "",
          roleId: "",
          gender: "",
          password: "",
        });
        setImage("");
      }
    } else {
      try {
        delete body.password;
        const response = await updateUser({ body, id: editId }).unwrap();
        handleResponse({
          res: response,
          onSuccess: handleCloseDrawer,
        });
      } catch (error) {
        handleError({ error, setError });
      }
    }
  };

  return (
    <>
      <div className="mb-[2.5rem]">
        <div className="flex gap-[1.5rem] ">
          <div className="border h-[6.25rem] w-[6.25rem] rounded-[0.375rem]">
            <img
              src={image !== "" ? `${IMAGE_BASE_URL}${image}` : userImage}
              alt="User"
              className="object-cover h-[6.25rem] w-[6.25rem] overflow-hidden"
              // crossOrigin="anonymous"
            />
          </div>
          <div className="space-y-[1rem]">
            <div className="flex gap-[1rem]">
              <button className="bg-primaryColor px-[1.25rem] py-[0.5rem] rounded-[0.375rem] text-white">
                <p className="font-[500] text-[0.9375rem]">
                  <MediaComponent
                    title={translate("Upload New Photo")}
                    handleConfirmImage={handleConfirmImage}
                    open={openMedia}
                    setOpen={setOpenMedia}
                  />
                </p>
              </button>
              <button
                className="bg-[#EBEEF0] px-[1.25rem] py-[0.5rem] rounded-[0.375rem] "
                onClick={() => setImage("")}
              >
                <p className="font-[500] text-[0.9375rem] whitespace-nowrap">
                  {translate("Reset")}
                </p>
              </button>
            </div>
            <div>
              <p className="font-[400] text-[0.9375rem] text-[#646e78]">
                {translate("Allowed JPG, GIF or PNG. Max size of 1MB")}
              </p>
            </div>
          </div>
        </div>
        {errors.imageUrl && (
          <p className="text-red-500 text-sm">{errors.imageUrl.message}</p>
        )}
      </div>
      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem]"
        autoComplete="off"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label="Username"
          placeholder="Username"
          type="text"
          autoComplete="new-username"
          {...register("username")}
          error={errors.username?.message}
        />
        <Input
          label="Email"
          placeholder="test@gmail.com"
          type="text"
          {...register("email")}
          error={errors.email?.message}
        />
        <Input
          label="First Name"
          placeholder="John"
          type="text"
          {...register("firstName")}
          error={errors.firstName?.message}
        />{" "}
        <Input
          label="Last Name"
          placeholder="Doe"
          type="text"
          {...register("lastName")}
          error={errors.lastName?.message}
        />
        <Input
          label="Mobile No"
          placeholder="98********"
          type="text"
          {...register("mobileNo")}
          error={errors.mobileNo?.message}
        />
        <Input
          label="Mobile Prefix"
          placeholder="+81"
          type="text"
          {...register("mobilePrefix")}
          error={errors.mobilePrefix?.message}
        />
        <Controller
          name="roleId"
          control={control}
          render={({ field }) => (
            <Select {...field} options={roleOptions} label="Role Type" />
          )}
        />
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <div>
              <Select {...field} options={GenderOptions} label="Gender" />
              {errors.gender && (
                <p className="text-red-500 text-sm">{errors.gender.message}</p>
              )}
            </div>
          )}
        />
        {!editId && (
          <Input
            label="Password"
            placeholder="******"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            error={errors.password?.message}
          />
        )}
        {/* <Input label="Is Active" type="checkbox" /> */}
        <div />
        <Button type="submit" className="submit-button">
          {" "}
          <div className="flex justify-center items-center gap-[0.5rem] ">
            {translate("Submit")}
          </div>
        </Button>
      </form>
    </>
  );
}
