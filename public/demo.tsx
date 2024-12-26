import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AttributeOption,
  AttributeType,
  Category,
  ProductAttribute,
  ProductInsertPayload,
  ProductItemInput,
  ProductItemInsertPayload,
  Provider,
} from "@/declare";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import preLoader from "@/api/preApiLoader";
import { z } from "zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { axiosInstance, reqConfig } from "@/utils/axiosConfig";
import { publicRoutes } from "./routes";
import axios, { HttpStatusCode } from "axios";
import log from "loglevel";
import { toast } from "sonner";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { getItemList } from "@/utils/product";
import { useCurrUser } from "@/utils/customHook";

const ProductSchema = z.object({
  productName: z.string().min(1, { message: "Không được bỏ trống!" }),
  warranty: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z
      .number({ message: "Không hợp lệ!" })
      .positive({ message: "Không hợp lệ!" })
      .safe({ message: "Không hợp lệ!" })
  ),
  description: z.string().nullable(),
  categoryID: z.string().min(1, { message: "Không được bỏ trống!" }),
  providerID: z.string().min(1, { message: "Không được bỏ trống!" }),
  height: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z
      .number({ message: "Không hợp lệ!" })
      .positive({ message: "Không hợp lệ!" })
      .safe({ message: "Không hợp lệ!" })
  ),
  length: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z
      .number({ message: "Không hợp lệ!" })
      .positive({ message: "Không hợp lệ!" })
      .safe({ message: "Không hợp lệ!" })
  ),
  width: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z
      .number({ message: "Không hợp lệ!" })
      .positive({ message: "Không hợp lệ!" })
      .safe({ message: "Không hợp lệ!" })
  ),
  weight: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z
      .number({ message: "Không hợp lệ!" })
      .positive({ message: "Không hợp lệ!" })
      .safe({ message: "Không hợp lệ!" })
  ),
  quantity: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z
      .number({
        message:
          "Vui lòng điền đầy đủ và hợp lệ thông tin của các trường bất buộc!",
      })
      .positive({
        message:
          "Vui lòng điền đầy đủ và hợp lệ thông tin của các trường bất buộc!",
      })
      .safe({
        message:
          "Vui lòng điền đầy đủ và hợp lệ thông tin của các trường bất buộc!",
      })
  ),
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z
      .number({
        message:
          "Vui lòng điền đầy đủ và hợp lệ thông tin của các trường bất buộc!",
      })
      .positive({
        message:
          "Vui lòng điền đầy đủ và hợp lệ thông tin của các trường bất buộc!",
      })
      .safe({
        message:
          "Vui lòng điền đầy đủ và hợp lệ thông tin của các trường bất buộc!",
      })
  ),
  productCode: z.string().min(1, { message: "Không được bỏ trống!" }),
  colorName: z.string().min(1, { message: "Không được bỏ trống!" }),
  storageName: z.string().nullable(),
  discount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z
      .number({
        message:
          "Vui lòng điền đầy đủ và hợp lệ thông tin của các trường bất buộc!",
      })
      .positive({
        message:
          "Vui lòng điền đầy đủ và hợp lệ thông tin của các trường bất buộc!",
      })
      .safe({
        message:
          "Vui lòng điền đầy đủ và hợp lệ thông tin của các trường bất buộc!",
      })
      .nullable()
  ),
});

type ProductInputForm = z.infer<typeof ProductSchema>;

const ProductAddition = () => {
  const [items, setItems] = useState<ProductItemInput[]>([
    {
      thump: null,
      quantity: null,
      price: null,
      productCode: null,
      discount: null,
      colorName: null,
      storageName: null,
      images: null,
    },
  ]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [attributes, setAttributes] = useState<AttributeType[]>([]);
  const [open, setOpen] = useState(false);
  const { currUser } = useCurrUser();
  const [selectedAttrType, setSelectedAttrType] = useState<AttributeType>();
  const [selectedProvider, setSelectedProvider] = useState<string>();
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [attrAdditionBucket, setAttrAdditionBucket] = useState<
    ProductAttribute[]
  >([]);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductInputForm>({
    resolver: zodResolver(ProductSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
      const categories = await preLoader.getCategories();
      const providers = await preLoader.getProviders();
      const attributes = await preLoader.getAttributes();

      setCategories(categories ?? []);
      setProviders(providers ?? []);
      setAttributes(attributes ?? []);
    };

    fetchData();
  }, []);

  const handleAddThump = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    event.preventDefault();

    const itemBucket: ProductItemInput[] = items.map((item, iter) => {
      if (iter === index) {
        return {
          ...item,
          thump: event.target.files ? event.target.files[0] : null,
        };
      }
      return item;
    });
    setItems(itemBucket);
  };

  const handleAddImgs = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    event.preventDefault();

    const itemBucket: ProductItemInput[] = items.map((item, iter) => {
      if (iter === index) {
        return {
          ...item,
          images: event.target.files ? [...event.target.files] : null,
        };
      }
      return item;
    });
    setItems(itemBucket);
  };

  const handleAddItem = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const bucket = [
      ...items,
      {
        thump: null,
        quantity: null,
        price: null,
        productCode: null,
        discount: null,
        colorName: null,
        storageName: null,
        images: null,
      },
    ];

    setItems(bucket);
  };

  const handleDelItem = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const itemsLen = items.length;
    const itemBucket: ProductItemInput[] =
      itemsLen <= 2 ? [items[0]] : [...items].slice(0, itemsLen - 1);

    setItems(itemBucket);
  };

  const findAttribute = (id: string | undefined): AttributeType | undefined => {
    return id ? attributes.find((value) => value.typeID === id) : undefined;
  };

  const handleOptionSelection = (optionID: string) => {
    const selectedOption: AttributeOption | undefined =
      selectedAttrType?.options.find((attr) => attr.optionID === optionID);

    if (selectedOption && selectedAttrType) {
      const bucket: ProductAttribute[] = [
        ...attrAdditionBucket,
        {
          typeID: selectedAttrType.typeID,
          typeValue: selectedAttrType.typeValue,
          optionID: selectedOption.optionID,
          optionName: selectedOption.optionValue,
        },
      ];
      setAttrAdditionBucket(bucket);
    }
  };

  const handleDeleteAttribute = (attribute: ProductAttribute) => {
    const bucket = attrAdditionBucket.filter(
      (attr) =>
        attr.typeID !== attribute.typeID || attr.optionID !== attribute.optionID
    );
    setAttrAdditionBucket(bucket);
  };

  const getAvailableAttributeType = (): AttributeType[] => {
    return attributes.filter(
      (attr) =>
        attrAdditionBucket.find(
          (productAttr) => productAttr.typeID === attr.typeID
        ) === undefined
    );
  };

  const handleFormSubmission: SubmitHandler<ProductInputForm> = async (
    data
  ) => {
    let valid = true;
    items.forEach((item) => {
      if (item.thump === null || item.images === null) {
        setError("root", { message: "Một số sản phẩm thiếu ảnh!" });
        valid = false;
        return;
      }
    });
    if (!valid) return;

    try {
      const productItems: ProductItemInsertPayload[] = await getItemList(items);
      const productPayload: ProductInsertPayload = {
        productName: data.productName,
        description: data.description,
        length: data.length,
        width: data.width,
        height: data.height,
        weight: data.weight,
        warranty: data.warranty,
        categoryID: selectedCategory as string,
        providerID: selectedProvider as string,
        options: attrAdditionBucket.reduce<string[]>((prev, curr) => {
          prev.push(curr.optionID);
          return prev;
        }, []),
        productItems: productItems,
      };
      console.log(productPayload);
      // await axiosInstance.post("/products", productPayload, {
      //   headers: {
      //     "User-id": currUser?.userID,
      //   },
      //   ...reqConfig,
      // });

      toast.success("Thêm sản phẩm thành công!");
      await publicRoutes.navigate("/admin/products/add", {
        unstable_viewTransition: true,
        replace: true,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status == HttpStatusCode.Conflict) {
          toast.error("Thêm sản phẩm thất bại: Mã sản phẩm !");
        } else {
          toast.error("Thêm sản phẩm thất bại!");
        }
        // Handle error response if available
        log.error(Response data: ${error.response?.data});
        log.error(Response status: ${error.response?.status}));
      } else {
        log.error("Unexpected error:", error);
      }
    }
  };

  return (
    <>
      <h1 className="text-4xl font-extrabold mt-8 mb-10">Thêm sản phẩm</h1>
      <form onSubmit={handleSubmit(handleFormSubmission)}>
        {/** PRODUCT */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/** LEFT */}
          <div className="grid gap-4 grid-cols-3">
            {/** PRODUCT NAME */}
            <div className="space-y-2 col-span-3">
              <Label htmlFor="name" className="text-lg font-extrabold">
                Tên sản phẩm
                <span className="text-red-600 ">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                {...register("productName")}
                placeholder="abc"
                className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
              />
              {errors.productName && (
                <div className="text-red-600">{errors.productName.message}</div>
              )}
            </div>
            {/** GURANTEE TIME SPAN */}
            <div className="space-y-2">
              <Label className="text-lg font-extrabold">
                Thời hạn bảo hành(tháng)
                <span className="text-red-600 ">*</span>
              </Label>
              <Input
                {...register("warranty")}
                min={0}
                className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
              />
              {errors.warranty && (
                <div className="text-red-600">{errors.warranty.message}</div>
              )}
            </div>
            {/** CATEGORY */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-lg font-extrabold">
                Danh mục
                <span className="text-red-600 ">*</span>
              </Label>
              <Select onValueChange={(value) => setSelectedCategory(value)}>
                <SelectTrigger
                  value={selectedCategory}
                  {...register("categoryID")}
                  className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
                >
                  <SelectValue id="category" className="p-0" />
                </SelectTrigger>
                {errors.categoryID && (
                  <div className="text-red-600">
                    {errors.categoryID.message}
                  </div>
                )}
                <SelectContent>
                  {categories.map((cate, index) => {
                    return (
                      <SelectItem
                        key={index}
                        value={cate.categoryID}
                        className="max-w-[30rem] truncate"
                      >
                        {cate.categoryName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {/** PROVIDER */}
            <div className="space-y-2">
              <Label htmlFor="provider" className="text-lg font-extrabold">
                Nhà phân phối
                <span className="text-red-600 ">*</span>
              </Label>
              <Select onValueChange={(value) => setSelectedProvider(value)}>
                <SelectTrigger
                  value={selectedProvider}
                  {...register("providerID")}
                  className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
                >
                  <SelectValue id="provider" className="p-0" />
                </SelectTrigger>
                {errors.providerID && (
                  <div className="text-red-600">
                    {errors.providerID.message}
                  </div>
                )}
                <SelectContent className="">
                  {providers.map((provider, index) => {
                    return (
                      <SelectItem
                        key={index}
                        value={provider.providerID}
                        className="max-w-[30rem] truncate"
                      >
                        {provider.providerName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {/** SIZE */}
            <div className="col-span-3 grid grid-cols-4 gap-4">
              {/** LENGTH */}
              <div className="space-y-2">
                <Label htmlFor="length" className="text-lg font-extrabold">
                  Dài(cm)
                  <span className="text-red-600 ">*</span>
                </Label>
                <Input
                  id="length"
                  {...register("length")}
                  min={0}
                  className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
                />
                {errors.length && (
                  <div className="text-red-600">{errors.length.message}</div>
                )}
              </div>
              {/** WIDTH */}
              <div className="space-y-2">
                <Label htmlFor="width" className="text-lg font-extrabold">
                  Rộng(cm)
                  <span className="text-red-600 ">*</span>
                </Label>
                <Input
                  id="width"
                  {...register("width")}
                  min={0}
                  className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
                />
                {errors.width && (
                  <div className="text-red-600">{errors.width.message}</div>
                )}
              </div>
              {/** HEIGHT */}
              <div className="space-y-2">
                <Label htmlFor="height" className="text-lg font-extrabold">
                  Cao(cm)
                  <span className="text-red-600 ">*</span>
                </Label>
                <Input
                  id="height"
                  {...register("height")}
                  min={0}
                  className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
                />
                {errors.height && (
                  <div className="text-red-600">{errors.height.message}</div>
                )}
              </div>
              {/** WEIGHT */}
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-lg font-extrabold">
                  Nặng(gram)
                  <span className="text-red-600 ">*</span>
                </Label>
                <Input
                  id="weight"
                  {...register("weight")}
                  min={0}
                  className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
                />
                {errors.weight && (
                  <div className="text-red-600">{errors.weight.message}</div>
                )}
              </div>
            </div>
            <div className="col-span-3 grid grid-cols-2 gap-4">
              {/** ATTRIBUTES */}
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="atr" className="text-lg font-extrabold">
                  Thể loại
                </Label>
                <Popover open={open} onOpenChange={() => setOpen(!open)}>
                  <PopoverTrigger
                    asChild
                    className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
                  >
                    <Button
                      variant="normal"
                      role="combobox"
                      // aria-expanded={open}
                      className="justify-between focus_!ring-2"
                    >
                      {selectedAttrType
                        ? selectedAttrType.typeValue
                        : "Chọn thể loại..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-max p-0">
                    <Command>
                      <CommandInput
                        placeholder="Tìm thể loại..."
                        className="text-lg"
                      />
                      <CommandList>
                        <CommandEmpty className="text-stone-500 text-center p-4">
                          Không tìm thấy.
                        </CommandEmpty>
                        <CommandGroup>
                          {getAvailableAttributeType().map((attr, index) => (
                            <CommandItem
                              key={index}
                              value={attr.typeValue}
                              onSelect={() => {
                                setSelectedAttrType(
                                  attr.typeID === selectedAttrType?.typeID
                                    ? undefined
                                    : attr
                                );
                                // setSelectedOptionID(undefined);
                                setOpen(false);
                              }}
                              className="text-lg"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedAttrType?.typeID === attr.typeID
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {attr.typeValue}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              {/** OPTIONS */}
              <div className="space-y-2">
                <Label htmlFor="option" className="text-lg font-extrabold">
                  Giá trị
                </Label>
                <Select onValueChange={(value) => handleOptionSelection(value)}>
                  <SelectTrigger className="border-2 border-stone-400 text-lg min-h-12 focus_border-none">
                    <SelectValue id="option" className="p-0" />
                  </SelectTrigger>
                  <SelectContent className="">
                    {findAttribute(selectedAttrType?.typeID)?.options.map(
                      (option, index) => {
                        return (
                          <SelectItem
                            key={index}
                            value={option.optionID}
                            className="max-w-[30rem] truncate"
                          >
                            {option.optionValue}
                          </SelectItem>
                        );
                      }
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/** PRODUCT ATTRIBUTES */}
            <ScrollArea className="col-span-3">
              <div className="flex py-6 space-x-2">
                {attrAdditionBucket.map((attr, index) => (
                  <Badge
                    variant="outline"
                    key={index}
                    className="w-max text-base bg-secondary text-secondary-foreground"
                  >
                    <span>{`${attr.typeValue} : ${attr.optionName}`}</span>
                    <X
                      className="ml-2 hover_text-primary cursor-pointer"
                      onClick={() => handleDeleteAttribute(attr)}
                    />
                  </Badge>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          {/** RIGHT */}
          <div className="space-y-2 mb-10">
            <Label htmlFor="desc" className="text-lg font-extrabold">
              Mô tả
            </Label>
            <Textarea
              id="desc"
              {...register("description")}
              placeholder="...abc"
              className="border-2 border-stone-400 text-lg min-h-12 focus_border-none h-full"
            />
          </div>
        </div>

        {/** ITEMS */}
        <ul className="mb-8">
          {items.map((item, parentIndex) => {
            return (
              <li
                key={parentIndex}
                className="grid grid-cols-2 gap-8 border-stone-200 border-2 rounded-xl p-5 mt-10"
              >
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor={`thump-${parentIndex}`}
                    className="text-lg font-extrabold"
                  >
                    Ảnh tiêu đề
                    <span className="text-red-600 ">*</span>
                  </Label>
                  <Input
                    type="file"
                    id={`thump-${parentIndex}`}
                    accept="image/*"
                    onChange={(e) => handleAddThump(e, parentIndex)}
                  />
                  {item.thump && (
                    <img
                      src={URL.createObjectURL(item.thump)}
                      className="max-w-40 object-cover rounded-md border-stone-300 border-2"
                    />
                  )}
                </div>
                <div className="overflow-auto flex flex-col gap-2">
                  <Label
                    htmlFor={`product-imgs-${parentIndex}`}
                    className="text-lg font-extrabold"
                  >
                    Ảnh sản phẩm
                    <span className="text-red-600 ">*</span>
                  </Label>
                  <Input
                    type="file"
                    id={`product-imgs-${parentIndex}`}
                    multiple
                    accept="image/*"
                    onChange={(e) => handleAddImgs(e, parentIndex)}
                  />
                  {item.images && (
                    <div className="overflow-auto flex flex-row gap-2 ">
                      {item.images.map((element, index) => {
                        return (
                          <img
                            key={index}
                            src={URL.createObjectURL(element)}
                            className="max-w-40 object-cover rounded-md border-stone-300 border-2"
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor={`price-${parentIndex}`}
                      className="text-lg font-e  xtrabold"
                    >
                      Giá tiền(VNĐ)
                      <span className="text-red-600 ">*</span>
                    </Label>
                    <Input
                      id={`price-${parentIndex}`}
                      type="text"
                      defaultValue={0}
                      onKeyUp={() => {
                        console.log(parentIndex);
                        items[parentIndex].price = getValues("price");
                      }}
                      {...register("price")}
                      className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
                    />
                  </div>
                  <>
                    {console.log(${parentIndex} : ${JSON.stringify(items)})}
                  </>
                  <div className="space-y-2">
                    <Label
                      htmlFor={`quantity-${parentIndex}`}
                      className="text-lg font-extrabold"
                    >
                      Số lượng
                      <span className="text-red-600 ">*</span>
                    </Label>
                    <Input
                      min={1}
                      max={1000000000}
                      id={`quantity-${parentIndex}`}
                      type="number"
                      value={getValues("quantity") ?? 1}
                      onKeyUp={() =>
                        (items[parentIndex].quantity = getValues("quantity"))
                      }
                      {...register("quantity")}
                      className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor={`code-${parentIndex}`}
                      className="text-lg font-extrabold"
                    >
                      Mã sản phẩm
                      <span className="text-red-600 ">*</span>
                    </Label>
                    <Input
                      id={`code-${parentIndex}`}
                      type="text"
                      value={getValues("productCode") ?? ""}
                      onKeyUp={() =>
                        (items[parentIndex].productCode =
                          getValues("productCode"))
                      }
                      {...register("productCode")}
                      className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor={`discount-${parentIndex}`}
                      className="text-lg font-extrabold"
                    >
                      Giảm giá(%)
                    </Label>
                    <Input
                      id={`discount-${parentIndex}`}
                      max={100}
                      min={0}
                      value={getValues("discount") ?? 0}
                      onKeyUp={() =>
                        (items[parentIndex].discount = getValues("discount"))
                      }
                      {...register("discount")}
                      className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor={`color-${parentIndex}`}
                      className="text-lg font-extrabold"
                    >
                      Màu
                      <span className="text-red-600 ">*</span>
                    </Label>
                    <Input
                      id={`color-${parentIndex}`}
                      type="text"
                      value={getValues("colorName") ?? ""}
                      onKeyUp={() =>
                        (items[parentIndex].colorName = getValues("colorName"))
                      }
                      {...register("colorName")}
                      className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor={`capacity-${parentIndex}`}
                      className="text-lg font-extrabold"
                    >
                      Dung lượng
                    </Label>
                    <Input
                      id={`capacity-${parentIndex}`}
                      type="text"
                      value={getValues("storageName") ?? ""}
                      onKeyUp={() =>
                        (items[parentIndex].storageName =
                          getValues("storageName"))
                      }
                      {...register("storageName")}
                      className="border-2 border-stone-400 text-lg min-h-12 focus_border-none"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/** BUTTONS */}
        <div className="flex justify-between">
          <span className="space-x-4">
            <Button
              variant="positive"
              className="text-xl"
              onClick={(e) => handleAddItem(e)}
            >
              Thêm
              <Plus />
            </Button>
            {items.length > 1 && (
              <Button
                variant="negative"
                className="text-xl"
                onClick={(e) => handleDelItem(e)}
              >
                Xóa
                <Trash2 />
              </Button>
            )}
          </span>
          <span className="space-x-4 flex items-center">
            {(errors.price ||
              errors.quantity ||
              errors.productCode ||
              errors.colorName ||
              errors.root) && (
              <div className="text-red-600">
                {
                  (
                    errors.price ||
                    errors.quantity ||
                    errors.productCode ||
                    errors.colorName ||
                    errors.root
                  )?.message
                }
              </div>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="neutral"
              className="text-xl"
            >
              {!isSubmitting ? (
                "Thêm sản phẩm"
              ) : (
                <LoadingSpinner size={26} className="text-white" />
              )}
              <Plus />
            </Button>
          </span>
        </div>
      </form>
    </>
  );
};

export { ProductAddition };